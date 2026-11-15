// Casho team identities allowed to open several merchant accounts (tests, demos).
// An email is still one account — it's the login — so extra accounts use the
// inbox's "+tag" aliases (mmcasho823+2@gmail.com lands in the same inbox).
// What may repeat is the phone. An entry with both only matches them together;
// a phone-only entry lets that phone sign up with any email; an email-only entry
// lets that inbox (and its aliases) sign up with any phone.

type MultiAccountIdentity = { phone: string; email?: string } | { email: string; phone?: undefined };

const MULTI_ACCOUNT_IDENTITIES: MultiAccountIdentity[] = [
  { email: "mmcasho823@gmail.com", phone: "01103129299" },
  { phone: "01211504120" },
  { email: "minadiesel51@gmail.com" },
];

/** "name+tag@domain" → "name@domain", lowercased. */
function inboxOf(email: string) {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  return `${local.split("+")[0]}@${domain}`;
}

/** Whether this signup may reuse a phone that another account already has. */
export function canReusePhone(email: string, phone: string) {
  const inbox = inboxOf(email);
  return MULTI_ACCOUNT_IDENTITIES.some(
    (identity) => (!identity.phone || identity.phone === phone.trim()) && (!identity.email || identity.email === inbox),
  );
}
