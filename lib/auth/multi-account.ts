// Casho team identities allowed to open several merchant accounts (tests, demos).
// An email is still one account — it's the login — so extra accounts use the
// inbox's "+tag" aliases (mmcasho823+2@gmail.com lands in the same inbox).
// What may repeat is the phone, and only together with its inbox.

const MULTI_ACCOUNT_IDENTITIES = [{ email: "mmcasho823@gmail.com", phone: "01103129299" }];

/** "name+tag@domain" → "name@domain", lowercased. */
function inboxOf(email: string) {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  return `${local.split("+")[0]}@${domain}`;
}

/** Whether this signup may reuse a phone that another account already has. */
export function canReusePhone(email: string, phone: string) {
  const inbox = inboxOf(email);
  return MULTI_ACCOUNT_IDENTITIES.some((identity) => identity.email === inbox && identity.phone === phone.trim());
}
