import { PLANS } from '../_lib/plans.js'
import { json, handleOptions } from '../_lib/response.js'
import { getFirebaseAdmin } from '../_lib/firebaseAdmin.js'

function readKeyId(env) {
  return env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID || ''
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function onRequest(context) {
  const { request, env } = context

  const options = handleOptions(request)
  if (options) return options
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const planKey = body.planKey
  const plan = PLANS[planKey]

  if (!isEmail(email)) {
    return json({ error: 'A valid email is required' }, 400)
  }
  if (!plan) {
    return json({ error: 'Invalid plan' }, 400)
  }

  const keyId = readKeyId(env)
  const keySecret = env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return json({ error: 'Payment provider is not configured' }, 500)
  }

  const auth = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`

  let order
  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: 'INR',
        receipt: `daaw_${Date.now()}`,
        notes: {
          email,
          name,
          planKey,
          planLabel: plan.label,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.id) {
      return json({ error: data?.error?.description || 'Failed to create order' }, 502)
    }
    order = data
  } catch {
    return json({ error: 'Unable to reach payment provider' }, 502)
  }

  try {
    const db = await getFirebaseAdmin()
    await db.collection('orders').doc(order.id).set({
      planKey,
      amount: plan.amount,
      currency: 'INR',
      email,
      name,
      status: 'created',
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Failed to persist order:', err)
    if (order?.id) {
      try {
        await fetch(`https://api.razorpay.com/v1/orders/${order.id}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: auth,
          },
        }).catch(() => {})
      } catch (cancelErr) {
        console.error('Failed to cancel orphaned Razorpay order:', cancelErr)
      }
    }
    return json({ error: 'Failed to prepare order. Please try again.' }, 500)
  }

  return json({
    order_id: order.id,
    amount: plan.amount,
    currency: 'INR',
    key_id: keyId,
    name: name || email,
    planKey,
    label: plan.label,
  })
}