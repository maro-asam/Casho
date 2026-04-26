import crypto from "crypto";

const ENCRYPTION_KEY_ENV = "PAYMENT_ENCRYPTION_KEY";

function getEncryptionKey() {
  const raw = process.env[ENCRYPTION_KEY_ENV]?.trim();

  if (!raw) {
    throw new Error(`${ENCRYPTION_KEY_ENV} is not set`);
  }

  const candidates = [
    Buffer.from(raw, "base64"),
    Buffer.from(raw, "hex"),
    Buffer.from(raw, "utf8"),
  ];

  const key = candidates.find((candidate) => candidate.length === 32);

  if (!key) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} must be 32 bytes. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }

  return key;
}

export function encryptSecret(value: string) {
  const plainText = value.trim();

  if (!plainText) {
    throw new Error("Cannot encrypt an empty secret");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(value: string) {
  if (!value) {
    throw new Error("Missing encrypted secret");
  }

  // Backward compatibility لو كنت خزنت key plaintext قبل كده بالغلط.
  if (!value.startsWith("v1:")) {
    return value;
  }

  const [, ivBase64, authTagBase64, encryptedBase64] = value.split(":");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted secret format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivBase64, "base64"),
  );

  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string) {
  const clean = value.trim();

  if (clean.length <= 4) {
    return "••••";
  }

  return `••••${clean.slice(-4)}`;
}
