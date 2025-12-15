import crypto from "crypto";

const ALG = "aes-256-gcm";

const MASTER_KEY_B64 = process.env.LLM_MASTER_KEY_B64 || "";
if (!MASTER_KEY_B64) throw new Error("Missing env var: LLM_MASTER_KEY_B64");

const MASTER_KEY = Buffer.from(MASTER_KEY_B64, "base64");
if (MASTER_KEY.length !== 32) throw new Error("LLM_MASTER_KEY_B64 must decode to 32 bytes");

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, MASTER_KEY, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(payloadB64: string): string {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);

  const decipher = crypto.createDecipheriv(ALG, MASTER_KEY, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
