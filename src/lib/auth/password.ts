// Edge-compatible password hashing using WebCrypto PBKDF2
// Since bcrypt is not supported on Cloudflare Workers/Edge runtime

const SALT_LEN = 16;
const ITERATIONS = 10000;
const KEY_LEN = 32;

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    KEY_LEN * 8
  );
  
  return `${ITERATIONS}:${bufferToHex(salt)}:${bufferToHex(hashBuffer)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  
  const iterations = parseInt(parts[0], 10);
  const salt = hexToBuffer(parts[1]);
  const originalHashHex = parts[2];
  
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    KEY_LEN * 8
  );
  
  return bufferToHex(hashBuffer) === originalHashHex;
}
