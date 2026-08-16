const SECRET_SEED = 'DaaWatDesk2024#SecretKey!';

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function toHex(num, length) {
  return num.toString(16).toUpperCase().padStart(length, '0');
}

export function generateKey(email, version = 1) {
  const normalized = email.trim().toLowerCase();

  if (version === 1) {
    const hash1 = hashCode(normalized + SECRET_SEED);
    const hash2 = hashCode(SECRET_SEED + normalized + 'v2');
    const hash3 = hashCode(normalized + 'salt' + SECRET_SEED);
    return `DAW-${toHex(hash1, 4)}-${toHex(hash2, 4)}-${toHex(hash3, 4)}`;
  }

  const v = String(version);
  const hash1 = hashCode(normalized + SECRET_SEED + v);
  const hash2 = hashCode(SECRET_SEED + normalized + 'v2' + v);
  const hash3 = hashCode(normalized + 'salt' + SECRET_SEED + v);

  const s1 = toHex(hash1, 4);
  const s2 = toHex(hash2, 4);
  const s3 = toHex(hash3, 4);

  return `DAW-${s1}-${s2}-${s3}`;
}

export function validateKey(email, enteredKey, version = 1) {
  if (!email || !enteredKey) return false;
  const expected = generateKey(email, version);
  return enteredKey.trim().toUpperCase() === expected;
}

export function isLicenseValid(expiresAt) {
  if (!expiresAt) return false;
  const expiry = expiresAt?.seconds
    ? new Date(expiresAt.seconds * 1000)
    : new Date(expiresAt);
  return expiry > new Date();
}

export function getExpiryDate(registeredAt) {
  const date = registeredAt ? new Date(registeredAt) : new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
}
