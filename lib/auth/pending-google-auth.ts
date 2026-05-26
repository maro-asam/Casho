import { createHmac } from "crypto";

export type PendingGoogleAuth = {
  googleId: string;
  email: string;
  name: string;
};

function getSecret() {
  const s = process.env.GOOGLE_CLIENT_SECRET;
  if (!s) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return s;
}

export function signPendingGoogleAuth(data: PendingGoogleAuth): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyPendingGoogleAuth(token: string): PendingGoogleAuth | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;
    const payload = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);
    const expectedSig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}
