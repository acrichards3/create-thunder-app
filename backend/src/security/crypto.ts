import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export interface EncryptionKey {
  key: Buffer;
}

export function hashToken(value: string): string {
  return new Bun.CryptoHasher("sha256").update(value).digest("hex");
}

export function getEncryptionKeyFromEnv(keyString: string | undefined): EncryptionKey | undefined {
  if (!keyString) {
    return undefined;
  }

  let buf: Buffer | undefined;
  const isHex = /^[A-Fa-f0-9]+$/.test(keyString) && keyString.length >= 64 && keyString.length % 2 === 0;
  if (isHex) {
    buf = Buffer.from(keyString, "hex");
  } else {
    const isBase64Chars = /^[A-Za-z0-9+/]+={0,2}$/.test(keyString);
    const hasValidLen = keyString.length % 4 === 0;
    if (isBase64Chars && hasValidLen) {
      const b = Buffer.from(keyString, "base64");
      if (b.length > 0) {
        buf = b;
      }
    }
  }
  if (!buf) {
    buf = Buffer.from(keyString, "utf8");
  }
  if (buf.length < 32) {
    const out = Buffer.alloc(32);
    buf.copy(out);
    buf = out;
  } else if (buf.length > 32) {
    buf = buf.subarray(0, 32);
  }
  return { key: buf };
}

export function encryptString(plainText: string, encKey: EncryptionKey | undefined): string {
  if (!encKey) {
    return plainText;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey.key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, authTag]).toString("base64");
}

export function decryptString(cipherTextB64: string, encKey: EncryptionKey | undefined): string {
  if (!encKey) {
    return cipherTextB64;
  }
  const buf = Buffer.from(cipherTextB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(12, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", encKey.key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString("utf8");
}
