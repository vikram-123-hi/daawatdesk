const AUTH_SCOPE = 'https://www.googleapis.com/auth/datastore'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

let clientPromise = null
let cachedToken = null

function base64url(input) {
  let str = typeof input === 'string' ? input : ''
  if (input instanceof Uint8Array) str = String.fromCharCode(...input)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) return JSON.parse(raw)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (b64) return JSON.parse(atob(b64))
  throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64 must be set')
}

async function pemToKey(serviceAccount) {
  const pem = serviceAccount.private_key
  const der = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  const binary = atob(der)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return crypto.subtle.importKey('pkcs8', bytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
}

async function signJwt(serviceAccount, key) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: AUTH_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  )
  const data = `${header}.${claims}`
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data)))
  return `${data}.${base64url(signature)}`
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value
  const serviceAccount = readServiceAccount()
  const key = await pemToKey(serviceAccount)
  const assertion = await signJwt(serviceAccount, key)
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.error || 'Failed to fetch access token')
  }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
  return cachedToken.value
}

function valueToField(value) {
  if (value === undefined) return undefined
  if (value === null) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(valueToField).filter(Boolean) } }
  }
  if (typeof value === 'object') {
    const fields = {}
    for (const [key, val] of Object.entries(value)) {
      const field = valueToField(val)
      if (field !== undefined) fields[key] = field
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(value) }
}

function fieldToValue(field) {
  if (field == null) return undefined
  if (field.stringValue !== undefined) return field.stringValue
  if (field.integerValue !== undefined) return Number(field.integerValue)
  if (field.doubleValue !== undefined) return field.doubleValue
  if (field.booleanValue !== undefined) return field.booleanValue
  if (field.nullValue !== undefined) return null
  if (field.timestampValue !== undefined) return field.timestampValue
  if (field.referenceValue !== undefined) return field.referenceValue
  if (field.geoPointValue !== undefined) return field.geoPointValue
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map(fieldToValue)
  }
  if (field.mapValue !== undefined) {
    const result = {}
    const fields = field.mapValue.fields || {}
    for (const [key, val] of Object.entries(fields)) result[key] = fieldToValue(val)
    return result
  }
  return undefined
}

function dataToFields(data) {
  const fields = {}
  for (const [key, value] of Object.entries(data)) {
    const field = valueToField(value)
    if (field !== undefined) fields[key] = field
  }
  return fields
}

function docToData(document) {
  return fieldToValue({ mapValue: { fields: document.fields || {} } }) || {}
}

function apiError(status, body, action) {
  const err = new Error(`Firestore ${action} failed: HTTP ${status}`)
  err.status = status
  const codeMap = {
    ALREADY_EXISTS: [6, 'already-exists'],
    NOT_FOUND: [5, 'not-found'],
    INVALID_ARGUMENT: [3, 'invalid-argument'],
  }
  const statusName = body?.error?.status || ''
  if (codeMap[statusName]) {
    err.code = codeMap[statusName][0]
    err.detail = codeMap[statusName][1]
    err.message = `${action} failed: ${statusName} (${codeMap[statusName][1]})`
  }
  return err
}

async function request(path, { method = 'GET', body } = {}) {
  const token = await getAccessToken()
  const url = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents/${path}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw apiError(res.status, data, method)
  return data
}

const firestore = {
  projectId: '',
  tokenUrl: TOKEN_URL,

  async init() {
    if (firestore.projectId) return
    firestore.projectId = readServiceAccount().project_id
  },

  collection(name) {
    return new CollectionRef(name)
  },
}

function escapeSegment(segment) {
  return encodeURIComponent(String(segment))
}

class DocumentRef {
  constructor(collection, id) {
    this.collection = collection
    this.id = id
    this._path = `${collection._path}/${escapeSegment(id)}`
  }

  async get() {
    const data = await request(`${this._path}`, { method: 'GET' })
    return new DocumentSnapshot(this, data, true)
  }

  async set(data) {
    await request(this._path, {
      method: 'PATCH',
      body: { fields: dataToFields(data) },
    })
  }

  async create(data) {
    await request(`${this.collection._path}?documentId=${escapeSegment(this.id)}`, {
      method: 'POST',
      body: { fields: dataToFields(data) },
    })
  }

  async update(data) {
    const fieldPaths = Object.keys(data).map((key) => escapeSegment(key))
    await request(`${this._path}?updateMask.fieldPaths=${fieldPaths.join('&updateMask.fieldPaths=')}`, {
      method: 'PATCH',
      body: { fields: dataToFields(data) },
    })
  }
}

class CollectionRef {
  constructor(path) {
    this._path = path
    this._query = { from: [{ collectionId: path }] }
  }

  doc(id) {
    return new DocumentRef(this, id)
  }

  where(field, op, value) {
    const next = new Query(this, this._query)
    next._where = { fieldPath: field, op, value: valueToField(value) }
    return next
  }

  limit(n) {
    const next = new Query(this, this._query)
    next._limit = n
    return next
  }

  async add(data) {
    const result = await request(this._path, {
      method: 'POST',
      body: { fields: dataToFields(data) },
    })
    const id = result.name.split('/').pop()
    return new DocumentRef(this, id)
  }

  async get() {
    const data = await request(this._path, { method: 'GET' })
    const docs = (data.documents || []).map((document) => new DocumentSnapshot(this, document, true))
    return new QuerySnapshot(docs)
  }
}

const OP_MAP = {
  '==': 'EQUAL',
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  in: 'IN',
}

class Query {
  constructor(collection, base) {
    this._collection = collection
    this._from = base.from
    this._where = null
    this._limit = null
  }

  where(field, op, value) {
    this._where = { fieldPath: field, op, value: valueToField(value) }
    return this
  }

  limit(n) {
    this._limit = n
    return this
  }

  async get() {
    const structuredQuery = { from: this._from }
    if (this._where) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: this._where.fieldPath },
          op: OP_MAP[this._where.op] || this._where.op,
          value: this._where.value,
        },
      }
    }
    if (this._limit != null) structuredQuery.limit = this._limit
    const data = await request(`${this._collection._path}:runQuery`, {
      method: 'POST',
      body: { structuredQuery },
    })
    const docs = (data || [])
      .filter((entry) => entry.document)
      .map((entry) => new DocumentSnapshot(this._collection, entry.document, true))
    return new QuerySnapshot(docs)
  }
}

class DocumentSnapshot {
  constructor(ref, document, exists) {
    this.ref = ref
    this.exists = Boolean(exists && document)
    this._data = this.exists ? docToData(document) : null
  }

  data() {
    return this._data
  }
}

class QuerySnapshot {
  constructor(docs) {
    this.docs = docs
    this.empty = docs.length === 0
  }

  forEach(callback) {
    this.docs.forEach(callback)
  }
}

export function getFirestore() {
  if (!clientPromise) {
    clientPromise = (async () => {
      await firestore.init()
      return firestore
    })()
  }
  return clientPromise
}
