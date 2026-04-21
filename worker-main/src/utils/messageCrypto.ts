const ENCRYPTION_PREFIX = 'enc:v1:';
const PASSPHRASE =
  import.meta.env.VITE_CHAT_ENCRYPTION_KEY || 'service-marketplace-dev-chat-key';
const SALT = 'service-marketplace-chat-salt-v1';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

let cachedKeyPromise: Promise<CryptoKey> | null = null;

const getKey = async () => {
  if (!cachedKeyPromise) {
    cachedKeyPromise = (async () => {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(PASSPHRASE),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(SALT),
          iterations: 120000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    })();
  }
  return cachedKeyPromise;
};

export const encryptMessageText = async (plainText: string) => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText)
  );
  const payload = `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
  return `${ENCRYPTION_PREFIX}${payload}`;
};

export const decryptMessageText = async (cipherText: string) => {
  if (!cipherText.startsWith(ENCRYPTION_PREFIX)) return cipherText;
  const payload = cipherText.slice(ENCRYPTION_PREFIX.length);
  const [ivBase64, encryptedBase64] = payload.split('.');
  if (!ivBase64 || !encryptedBase64) return '[Encrypted message]';

  try {
    const key = await getKey();
    const iv = fromBase64(ivBase64);
    const encrypted = fromBase64(encryptedBase64);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    return decoder.decode(decrypted);
  } catch {
    return '[Encrypted message]';
  }
};

