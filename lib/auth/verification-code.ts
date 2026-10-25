// Pure helpers shared by the verify-email form (client) and lib/auth/email-verification (server).

export const CODE_LENGTH = 6;

/** Lenient input: Arabic-Indic digits and spaces/dashes from a paste are fine. */
export function normalizeCode(raw: string) {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}
