export const API_VERSION = "v1";

export const SCOPES = [
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "products:read",
  "shipments:read",
  "shipments:write",
  "webhooks:read",
  "webhooks:write",
] as const;

export type ApiScope = (typeof SCOPES)[number];

export interface ApiKeyContext {
  id: string;
  storeId: string;
  scopes: string[];
  ipWhitelist: string[];
}

export interface ApiContext {
  apiKey: ApiKeyContext;
  store: {
    id: string;
    slug: string;
    name: string;
  };
  ipAddress: string | null;
  startTime: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
