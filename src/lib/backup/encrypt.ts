const encoder = new TextEncoder()
const decoder = new TextDecoder()

const ensureKeyBytes = async (secret: string): Promise<ArrayBuffer> => crypto.subtle.digest('SHA-256', encoder.encode(secret))
const bytesToBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))
const base64ToBytes = (value: string): Uint8Array => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

export const encryptBackup = async (payload: string, secret: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', await ensureKeyBytes(secret), 'AES-GCM', false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(payload))
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`
}

export const decryptBackup = async (payload: string, secret: string) => {
  const [ivBase64, cipherBase64] = payload.split('.')
  const key = await crypto.subtle.importKey('raw', await ensureKeyBytes(secret), 'AES-GCM', false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(ivBase64) }, key, base64ToBytes(cipherBase64))
  return decoder.decode(decrypted)
}
