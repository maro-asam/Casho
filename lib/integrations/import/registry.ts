import type { ImportConnection } from "@prisma/client";
import { createShopifySource } from "@/lib/integrations/shopify/source";
import type { ImportSource } from "./types";

/** One entry per provider — a new platform plugs in here. */
export function createImportSource(connection: ImportConnection): ImportSource {
  switch (connection.provider) {
    case "SHOPIFY":
      return createShopifySource(connection);
  }
}
