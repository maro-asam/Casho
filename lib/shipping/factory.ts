/**
 * Credential-aware provider factory.
 *
 * Accepts per-store credentials decrypted from ShippingIntegration.credentials
 * and returns the correct ShippingProvider implementation.
 * Adding a new carrier = add one case here + one provider file.
 */

import { BostaProvider } from "./providers/bosta";
import { AramexProvider } from "./providers/aramex";
import type { ShippingProvider } from "./types";

export type ShippingProviderKey = "BOSTA" | "ARAMEX";

// ─── Credential shapes expected in the DB JSON ────────────────────────────────

export interface BostaCredentials {
  apiKey: string;
  pickupCity?: string;
}

export interface AramexCredentials {
  username: string;
  password: string;
  accountNumber: string;
  accountPin: string;
  accountEntity: string;
  accountCountryCode?: string; // defaults to "EG"
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getShippingProvider(
  providerKey: ShippingProviderKey,
  credentials: Record<string, string>,
): ShippingProvider {
  switch (providerKey) {
    case "BOSTA": {
      const creds = credentials as unknown as BostaCredentials;
      if (!creds.apiKey) throw new Error("Bosta: apiKey is required");
      return new BostaProvider({
        apiKey: creds.apiKey,
        pickupCity: creds.pickupCity,
      });
    }

    case "ARAMEX": {
      const creds = credentials as unknown as AramexCredentials;
      const required: (keyof AramexCredentials)[] = [
        "username",
        "password",
        "accountNumber",
        "accountPin",
        "accountEntity",
      ];
      for (const field of required) {
        if (!creds[field]) throw new Error(`Aramex: ${field} is required`);
      }
      return new AramexProvider({
        userName: creds.username,
        password: creds.password,
        accountNumber: creds.accountNumber,
        accountPin: creds.accountPin,
        accountEntity: creds.accountEntity,
        accountCountryCode: creds.accountCountryCode ?? "EG",
        version: "v1.0",
      });
    }

    default: {
      const exhaustive: never = providerKey;
      throw new Error(`Unknown shipping provider: ${exhaustive}`);
    }
  }
}
