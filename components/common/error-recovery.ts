// Shared by the error boundaries (app/global-error, dashboard/error).

const RELOAD_KEY = "casho-error-reload";

/**
 * After a deploy, a tab that was already open asks for JS chunks / server
 * actions that no longer exist. A reload fixes it — so we do it once, quietly.
 */
export function isStaleDeployError(error: Error) {
  const text = `${error.name} ${error.message}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to find Server Action|UnrecognizedActionError/i.test(text);
}

/** Reloads at most once a minute, so a real bug can't loop forever. Returns true when it reloaded. */
export function reloadOnceForStaleDeploy(error: Error) {
  if (!isStaleDeployError(error)) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** One line to send to support: the real message (client errors keep it in production) or the server digest. */
export function errorSummary(error: Error & { digest?: string }) {
  return [error.name !== "Error" ? error.name : null, error.message, error.digest ? `digest: ${error.digest}` : null]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 300);
}
