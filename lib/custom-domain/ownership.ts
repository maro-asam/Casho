import { createHash } from "crypto";
import { promises as dns } from "node:dns";
import { DOMAIN_VERIFY_PREFIX } from "./shared";

// ─────────────────────────────────────────────────────────────────────────────
//  Proof that a store controls a domain's DNS. Pointing a domain at us proves
//  nothing about *which* store owns it (every store shares the same target),
//  so activation also needs a TXT record only this store's token matches:
//    _casho-verify.<domain>  TXT  "casho-verify=<token>"
//  The token needn't be secret — writing the victim's DNS is the hard part.
// ─────────────────────────────────────────────────────────────────────────────

export function domainVerificationToken(storeId: string) {
  return createHash("sha256").update(`casho-domain:${storeId}`).digest("hex").slice(0, 32);
}

export async function checkDomainOwnership(domain: string, storeId: string) {
  try {
    const chunks = await dns.resolveTxt(`${DOMAIN_VERIFY_PREFIX}.${domain}`);
    const expected = `casho-verify=${domainVerificationToken(storeId)}`;
    return chunks.some((parts) => parts.join("").trim() === expected);
  } catch {
    return false;
  }
}
