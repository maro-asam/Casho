/**
 * Instagram OAuth 2.0 helpers.
 * Uses Facebook Login with instagram_manage_messages scope.
 */

const OAUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth";
const TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";

export function buildAuthorizationUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.APP_URL;

  if (!appId || !appUrl) {
    throw new Error("META_APP_ID and APP_URL must be set");
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${appUrl}/api/instagram/oauth/callback`,
    scope: [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "pages_show_list",
      "pages_messaging",
    ].join(","),
    response_type: "code",
    state,
  });

  return `${OAUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
}> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const appUrl = process.env.APP_URL!;

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: `${appUrl}/api/instagram/oauth/callback`,
    code,
  });

  const res = await fetch(`${TOKEN_URL}?${params.toString()}`);
  const json = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    error?: { message: string };
  };

  if (json.error || !json.access_token) {
    throw new Error(json.error?.message ?? "Failed to exchange OAuth code");
  }

  return {
    access_token: json.access_token,
    token_type: json.token_type ?? "bearer",
  };
}
