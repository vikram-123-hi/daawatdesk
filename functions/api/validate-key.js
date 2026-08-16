import { getFirebaseAdmin } from '../_lib/firebaseAdmin.js'
import { json, handleOptions } from '../_lib/response.js'

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidKeyFormat(value) {
  return /^DAW-[0-9A-F]{4}(?:-[0-9A-F]{4})+$/.test(value)
}

function isFuture(expiresAt) {
  if (!expiresAt) return false
  const expiry = expiresAt?.seconds
    ? new Date(expiresAt.seconds * 1000)
    : new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return false
  return expiry > new Date()
}

export async function onRequest(context) {
  const { request } = context

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
  const key = typeof body.key === 'string' ? body.key.trim().toUpperCase() : ''

  if (!isEmail(email) || !isValidKeyFormat(key)) {
    return json({ error: 'A valid email and DAW- format license key are required' }, 400)
  }

  try {
    const db = await getFirebaseAdmin()
    const snap = await db.collection('licenses').where('email', '==', email).limit(50).get()

    let matched = null
    snap.forEach((doc) => {
      if (matched) return
      const data = doc.data()
      if (String(data.key || '').trim().toUpperCase() === key) {
        matched = data
      }
    })

    if (!matched) {
      return json({ valid: false, reason: 'not_found' })
    }
    if (matched.status !== 'active') {
      return json({ valid: false, reason: 'invalid' })
    }
    if (!isFuture(matched.expiresAt)) {
      return json({ valid: false, reason: 'expired' })
    }
    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!userSnap.empty && userSnap.docs[0].data().keyRevoked === true) {
      return json({ valid: false, reason: 'revoked' })
    }
    return json({ valid: true })
  } catch (err) {
    console.error('Validate key error:', err)
    return json({ error: 'Failed to validate license key' }, 500)
  }
}
