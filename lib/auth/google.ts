const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
};

function getRedirectUri() {
  return `${process.env.APP_URL}/api/auth/google/callback`;
}

/** CSRF state for the OAuth round trip — random per attempt, checked in the callback. */
export const GOOGLE_STATE_COOKIE = "googleOAuthState";

export function googleStateCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === "production";
  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    // The flow starts on app.<root> but APP_URL (the callback host) may be the bare root.
    domain: isProduction ? `.${rootDomain}` : undefined,
  };
}

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    state,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{ access_token?: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
