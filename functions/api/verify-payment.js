import crypto from 'node:crypto'
import { PLANS } from '../_lib/plans.js'
import { getFirebaseAdmin } from '../_lib/firebaseAdmin.js'
import { json, handleOptions } from '../_lib/response.js'

function generateKey() {
  const groups = []
  for (let i = 0; i < 4; i++) {
    groups.push(crypto.randomBytes(2).toString('hex').toUpperCase())
  }
  return `DAW-${groups.join('-')}`
}

function verifySignature(orderId, paymentId, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signature, 'hex')
  if (a.length !== b.length || a.length === 0) return false
  return crypto.timingSafeEqual(a, b)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[ch]
  })
}

function licenseEmailHtml({ key, email, expiresAt, label }) {
  const safeKey = escapeHtml(key)
  const safeEmail = escapeHtml(email)
  const safeLabel = escapeHtml(label)
  const safeExpiresAt = escapeHtml(expiresAt)
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#fff7f0;padding:24px;border-radius:12px;max-width:520px;margin:0 auto;border:1px solid #ffe0c7;">
      <div style="text-align:center;margin-bottom:20px;">
        <h1 style="color:#FF6B00;margin:0;font-size:22px;">DaawatDesk</h1>
        <p style="color:#8a5a3b;margin:6px 0 0;font-size:13px;">Your license key is ready</p>
      </div>
      <div style="background:#ffffff;padding:20px 22px;border-radius:10px;border:1px solid #ffe0c7;">
        <p style="color:#333;font-size:14px;margin:0 0 10px;">Congratulations! Your <strong>${safeLabel}</strong> license has been activated.</p>
        <div style="background:#fff3eb;border:1px dashed #FF6B00;border-radius:8px;padding:14px;text-align:center;margin:14px 0;">
          <div style="color:#9a9a9a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Your License Key</div>
          <code style="font-family:monospace;font-size:18px;font-weight:bold;color:#1A1A2E;letter-spacing:2px;">${safeKey}</code>
        </div>
        <ul style="color:#555;font-size:13px;padding-left:18px;line-height:1.7;">
          <li><strong>Plan:</strong> ${safeLabel}</li>
          <li><strong>Activated for:</strong> ${safeEmail}</li>
          <li><strong>Valid until:</strong> ${safeExpiresAt}</li>
        </ul>
        <p style="margin-top:18px;color:#333;font-size:13px;line-height:1.6;">
          To activate, create your account at daawatdesk-76b.pages.dev/register and enter this key when prompted, or go to the Renew page to apply an existing account.
        </p>
      </div>
      <p style="color:#b7a294;font-size:11px;text-align:center;margin-top:18px;">This is an automated email. Please do not reply.</p>
    </div>
  `
}

async function sendLicenseEmail({ apiKey, from, to, key, expiresAt, label }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your DaawatDesk License Key',
      html: licenseEmailHtml({ key, email: to, expiresAt, label }),
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || 'Email send failed')
  }
}

function formatExpiry(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body
  const userId = typeof body.userId === 'string' ? body.userId : ''

  if (!orderId || !paymentId || !signature) {
    return json({ error: 'Missing payment details' }, 400)
  }

  const keySecret = env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return json({ error: 'Payment provider is not configured' }, 500)
  }

  if (!verifySignature(orderId, paymentId, signature, keySecret)) {
    return json({ error: 'Invalid payment signature' }, 400)
  }

  let db
  try {
    db = await getFirebaseAdmin()
  } catch (err) {
    console.error('Verify payment init error:', err)
    return json({ error: 'Failed to initialize payment store' }, 500)
  }

  // Plan + amount are derived from the persisted order doc, NEVER from the request body.
  const ordersRef = db.collection('orders').doc(orderId)
  const orderSnap = await ordersRef.get()
  if (!orderSnap.exists) {
    return json({ error: 'Invalid order' }, 400)
  }
  const orderDoc = orderSnap.data()
  const planKey = orderDoc.planKey
  const plan = PLANS[planKey]
  if (!plan || Number(orderDoc.amount) !== plan.amount) {
    return json({ error: 'Order amount mismatch' }, 400)
  }

  const licenseRef = db.collection('licenses').doc(paymentId)

  // Idempotency: a previously processed payment must not re-issue, re-email, or re-extend.
  const existingSnap = await licenseRef.get()
  if (existingSnap.exists) {
    const existing = existingSnap.data()
    await ordersRef.update({ status: 'paid', paymentId, paidAt: new Date().toISOString() }).catch(() => {})
    return json({
      key: existing.key,
      expiresAt: existing.expiresAt,
      email: existing.email,
      planKey: existing.planKey,
      amount: existing.amount,
      alreadyProcessed: true,
    })
  }

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths)

  const key = generateKey()
  const label = plan.label
  const paidEmail = orderDoc.email || ''

  try {
    await licenseRef.create({
      key,
      email: paidEmail,
      name: typeof orderDoc.name === 'string' ? orderDoc.name.trim() : '',
      planKey,
      amount: plan.amount,
      currency: 'INR',
      status: 'active',
      orderId,
      paymentId,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      userId,
    })
  } catch (err) {
    if (err?.code === 6 || err?.code === 'already-exists' || String(err?.message || '').includes('already exists')) {
      const raced = await licenseRef.get()
      if (raced.exists) {
        const existing = raced.data()
        await ordersRef.update({ status: 'paid', paymentId, paidAt: new Date().toISOString() }).catch(() => {})
        return json({
          key: existing.key,
          expiresAt: existing.expiresAt,
          email: existing.email,
          planKey: existing.planKey,
          amount: existing.amount,
          alreadyProcessed: true,
        })
      }
    }
    console.error('Verify payment DB error:', err)
    return json({ error: 'Failed to store license' }, 500)
  }

  if (paidEmail) {
    try {
      const existing = await db.collection('users').where('email', '==', paidEmail).limit(1).get()
      if (!existing.empty) {
        const existingExpiry = parseDate(existing.docs[0].data().licenseExpiry)
        const newExpiry = existingExpiry && existingExpiry.getTime() > expiresAt.getTime() ? existingExpiry : expiresAt
        await existing.docs[0].ref.update({
          licenseExpiry: newExpiry.toISOString(),
          licenseKey: key,
          keyRevoked: false,
        })
      } else {
        await db.collection('users').add({
          name: typeof orderDoc.name === 'string' ? orderDoc.name.trim() : '',
          email: paidEmail,
          createdAt: now.toISOString(),
          licenseExpiry: expiresAt.toISOString(),
          licenseKey: key,
          keyVersion: 1,
          keyRevoked: false,
          role: 'client',
        })
      }
    } catch (err) {
      console.error('Verify payment user update error:', err)
    }
  }

  await ordersRef.update({ status: 'paid', paymentId, paidAt: now.toISOString() }).catch((err) => {
    console.error('Verify payment order status update error:', err)
  })

  const apiKey = env.RESEND_API_KEY
  const from = env.RESEND_FROM_EMAIL
  if (apiKey && from && paidEmail) {
    try {
      await sendLicenseEmail({ apiKey, from, to: paidEmail, key, expiresAt: formatExpiry(expiresAt), label })
    } catch (err) {
      console.error('License email send error:', err)
    }
  }

  return json({
    key,
    expiresAt: expiresAt.toISOString(),
    email: paidEmail,
    planKey,
    amount: plan.amount,
  })
}
