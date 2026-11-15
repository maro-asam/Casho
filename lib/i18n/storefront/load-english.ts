import { registerStoreEnglish } from "./runtime";

let pending: Promise<void> | null = null;

/** Loads the storefront English dictionary once (code-split chunk in the browser). */
export function ensureStoreEnglish(): Promise<void> {
  pending ??= import("./en").then((m) => registerStoreEnglish(m.default));
  return pending;
}
