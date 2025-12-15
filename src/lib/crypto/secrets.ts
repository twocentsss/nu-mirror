import crypto from "crypto";

const ALG = "aes-256-gcm";

function getMasterKey() {
  const b64 = process.env.LLM_MASTER_KEY_B64 || "";
  if (!b64) {
    // Build-time safety: return dummy key if missing to prevent build crash.
    // At runtime, this will result in useless crypto, but prevents the "module evaluation" crash.
    console.warn("WARN: LLM_MASTER_KEY_B64 missing. Using dummy key.");
    return Buffer.alloc(32);
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("LLM_MASTER_KEY_B64 must decode to 32 bytes");
  return key;
}

export function encryptSecret(plain: string): string {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, masterKey, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(payloadB64: string): string {
  const masterKey = getMasterKey();
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);

  const decipher = crypto.createDecipheriv(ALG, masterKey, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
