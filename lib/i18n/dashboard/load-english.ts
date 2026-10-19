import { registerEnglish } from "./runtime";

let pending: Promise<void> | null = null;

/** Loads the English dictionary once (code-split chunk in the browser). */
export function ensureEnglish(): Promise<void> {
  pending ??= import("./en").then((m) => registerEnglish(m.default));
  return pending;
}
