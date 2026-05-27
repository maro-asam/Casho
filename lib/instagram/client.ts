/**
 * Meta Graph API client — typed wrappers for Instagram Messaging API.
 * Base URL: https://graph.facebook.com/v21.0
 */

const BASE_URL = "https://graph.facebook.com/v21.0";

export class MetaApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public type?: string,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

async function metaFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    next: { revalidate: 0 }, // always fresh
  });

  const json = (await res.json()) as T & { error?: { code: number; message: string; type: string } };

  if ("error" in json && json.error) {
    throw new MetaApiError(json.error.code, json.error.message, json.error.type);
  }

  return json;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export type IgUserProfile = {
  id: string;
  username: string;
  name?: string;
};

export type IgPage = {
  id: string;
  name: string;
  access_token: string;
};

export type IgPagesResponse = {
  data: IgPage[];
};

export type IgConversation = {
  id: string;
  updated_time: string;
  message_count: number;
  participants: {
    data: Array<{ id: string; username?: string; name?: string }>;
  };
};

export type IgConversationsResponse = {
  data: IgConversation[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
};

export type IgMessage = {
  id: string;
  from: { id: string; username?: string; name?: string };
  message?: string;
  attachments?: { data: Array<{ type: string; payload: { url: string } }> };
  created_time: string;
};

export type IgMessagesResponse = {
  data: IgMessage[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
};

// ─── API Methods ───────────────────────────────────────────────────────────────

/** Get the IG user profile for a given access token */
export async function getIgUserProfile(accessToken: string): Promise<IgUserProfile> {
  return metaFetch<IgUserProfile>("/me", {
    params: {
      fields: "id,username,name",
      access_token: accessToken,
    },
  });
}

/** Get list of Facebook Pages the user manages (to find the linked Page ID) */
export async function getLinkedPages(accessToken: string): Promise<IgPagesResponse> {
  return metaFetch<IgPagesResponse>("/me/accounts", {
    params: {
      fields: "id,name,access_token",
      access_token: accessToken,
    },
  });
}

/** Exchange short-lived token for long-lived token (~60 days) */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;

  return metaFetch("/oauth/access_token", {
    params: {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    },
  });
}

/** Get all Instagram conversations for the IG user */
export async function getConversations(
  igUserId: string,
  accessToken: string,
  after?: string,
): Promise<IgConversationsResponse> {
  return metaFetch<IgConversationsResponse>(`/${igUserId}/conversations`, {
    params: {
      platform: "instagram",
      fields: "id,updated_time,message_count,participants",
      access_token: accessToken,
      limit: "25",
      ...(after ? { after } : {}),
    },
  });
}

/** Get messages in a specific conversation */
export async function getConversationMessages(
  conversationId: string,
  accessToken: string,
  after?: string,
): Promise<IgMessagesResponse> {
  return metaFetch<IgMessagesResponse>(`/${conversationId}/messages`, {
    params: {
      fields: "id,from,message,attachments,created_time",
      access_token: accessToken,
      limit: "50",
      ...(after ? { after } : {}),
    },
  });
}

/** Subscribe this IG user's messages to your app's webhook */
export async function subscribeToWebhook(
  pageId: string,
  pageAccessToken: string,
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`/${pageId}/subscribed_apps`, {
    method: "POST",
    params: {
      subscribed_fields: "messages,messaging_seen",
      access_token: pageAccessToken,
    },
  });
}

/** Refresh a long-lived token (call this before it expires) */
export async function refreshLongLivedToken(accessToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  return metaFetch("/oauth/access_token", {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: accessToken,
    },
  });
}
