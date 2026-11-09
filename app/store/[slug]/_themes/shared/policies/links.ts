import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { policyPath } from "@/lib/store-policies";
import type { StoreShell } from "../../types";

/** Footer links to the store's legal pages — append them to the theme's help/info group. */
export function policyFooterLinks(shell: Pick<StoreShell, "slug" | "policies">) {
  return shell.policies.map((p) => ({ label: p.short, href: buildStoreUrl(shell.slug, policyPath(p.type)) }));
}
