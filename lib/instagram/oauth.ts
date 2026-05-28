/**
 * Instagram OAuth 2.0 helpers.
 * Uses Instagram Login with instagram_business_* scopes (new Instagram API).
 */

const OAUTH_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";

export function buildAuthorizationUrl(state: string): string {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appUrl = process.env.APP_URL;

  if (!appId || !appUrl) {
    throw new Error("INSTAGRAM_APP_ID and APP_URL must be set");
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${appUrl}/api/instagram/oauth/callback`,
    scope: [
      "instagram_business_basic",
      "instagram_business_manage_messages",
    ].join(","),
    response_type: "code",
    state,
  });

  return `${OAUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  user_id: string;
}> {
  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const appUrl = process.env.APP_URL!;

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: `${appUrl}/api/instagram/oauth/callback`,
    code,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const json = (await res.json()) as {
    access_token?: string;
    user_id?: string;
    error_type?: string;
    error_message?: string;
  };

  if (!json.access_token) {
    throw new Error(json.error_message ?? "Failed to exchange OAuth code");
  }

  return {
    access_token: json.access_token,
    user_id: json.user_id ?? "",
  };
}
