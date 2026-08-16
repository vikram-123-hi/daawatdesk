import admin from 'firebase-admin'

let dbPromise = null

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) return JSON.parse(raw)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (b64) return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64 must be set')
}

export function getFirebaseAdmin() {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (!admin.apps.length) {
        const serviceAccount = readServiceAccount()
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        })
      }
      return admin.firestore()
    })()
  }
  return dbPromise
}