/**
 * The two ends of the WooCommerce key approval, separated from the routes so
 * every check is unit-tested.
 *
 * Callback (POST from the merchant's WordPress server, no browser session):
 * accepted only when `user_id` opens as OUR sealed, unexpired state, the key
 * pair is well-formed and readable, and the user in the state may still
 * manage imports for that store. The keys are saved without calling the site
 * back: WordPress is still waiting on this request, and on hosts with a single
 * PHP worker a call back would deadlock. The preview checks them right after.
 *
 * Return (the merchant's browser): only reports the outcome, and only to the
 * Casho user who started the flow.
 */
import { isWooKeyPair, openAuthState, STATE_TTL_MS, type AuthState, type WooCredentials } from "./auth";
import { siteKey } from "./site";

export type CallbackError = "invalid_request" | "invalid_state" | "missing_scopes" | "forbidden";

export type SaveConnectionInput = {
  storeId: string;
  userId: string;
  home: string;
  name: string;
  credentials: WooCredentials;
  permissions: string;
};

export type CallbackDeps = {
  canManageImports(userId: string, storeId: string): Promise<boolean>;
  saveConnection(input: SaveConnectionInput): Promise<void>;
};

export type CallbackResult = { ok: true; storeId: string; site: string } | { ok: false; error: CallbackError };

const READ_PERMISSIONS = new Set(["read", "read_write"]);

export async function handleWooCommerceCallback(input: { body: unknown; now?: number }, deps: CallbackDeps): Promise<CallbackResult> {
  if (!input.body || typeof input.body !== "object") return { ok: false, error: "invalid_request" };
  const body = input.body as Record<string, unknown>;

  const state = openAuthState(body.user_id, input.now);
  if (!state) return { ok: false, error: "invalid_state" };

  if (!isWooKeyPair(body.consumer_key, body.consumer_secret)) return { ok: false, error: "invalid_request" };
  const permissions = typeof body.key_permissions === "string" ? body.key_permissions : "";
  if (!READ_PERMISSIONS.has(permissions)) return { ok: false, error: "missing_scopes" };

  if (!(await deps.canManageImports(state.userId, state.storeId))) return { ok: false, error: "forbidden" };

  await deps.saveConnection({
    storeId: state.storeId,
    userId: state.userId,
    home: state.home,
    name: state.name,
    credentials: { consumerKey: body.consumer_key as string, consumerSecret: body.consumer_secret as string },
    permissions,
  });
  return { ok: true, storeId: state.storeId, site: siteKey(state.home) };
}

export type ReturnOutcome =
  | { ok: true; state: AuthState }
  | { ok: false; error: "denied" | "invalid_state" | "session_mismatch" | "callback_failed" };

export type ReturnDeps = {
  /** The store's WooCommerce connection, if any. */
  findConnection(storeId: string): Promise<{ status: string; externalShopId: string; updatedAt: Date } | null>;
};

export async function handleWooCommerceReturn(
  input: { query: URLSearchParams; sessionUserId: string | null; now?: number },
  deps: ReturnDeps,
): Promise<ReturnOutcome> {
  const state = openAuthState(input.query.get("user_id"), input.now);
  if (!state) return { ok: false, error: "invalid_state" };
  if (!input.sessionUserId || input.sessionUserId !== state.userId) return { ok: false, error: "session_mismatch" };
  if (input.query.get("success") !== "1") return { ok: false, error: "denied" };

  // WooCommerce only redirects here after our callback answered 200, so the
  // connection must exist — unless the site couldn't reach us.
  const connection = await deps.findConnection(state.storeId);
  // Saved after the state was issued (a minute of slack for clock drift).
  const issuedAt = state.exp - STATE_TTL_MS - 60_000;
  if (
    !connection ||
    connection.status !== "ACTIVE" ||
    connection.externalShopId !== siteKey(state.home) ||
    connection.updatedAt.getTime() < issuedAt
  ) {
    return { ok: false, error: "callback_failed" };
  }
  return { ok: true, state };
}
