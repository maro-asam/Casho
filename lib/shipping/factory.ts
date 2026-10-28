/**
 * Credential-aware provider factory.
 *
 * Accepts per-store credentials decrypted from ShippingIntegration.credentials
 * and returns the carrier's API adapter. Only carriers registered with
 * `integration: "api"` in ./carriers have one; manual carriers return null.
 * Adding an API carrier = one provider file + one case here.
 */

import { BostaProvider } from "./providers/bosta";
import { AramexProvider } from "./providers/aramex";
import { MylerzProvider } from "./providers/mylerz";
import type { ShippingProvider } from "./types";
import type { CarrierKey } from "./carriers";

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

export interface MylerzCredentials {
  username: string;
  password: string;
  warehouse?: string;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getShippingProvider(
  carrier: CarrierKey,
  credentials: Record<string, string>,
  opts: { pickupCity?: string } = {},
): ShippingProvider | null {
  switch (carrier) {
    case "BOSTA": {
      const creds = credentials as unknown as BostaCredentials;
      if (!creds.apiKey) throw new Error("Bosta: apiKey is required");
      return new BostaProvider({
        apiKey: creds.apiKey,
        pickupCity: opts.pickupCity ?? creds.pickupCity,
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
        accountCountryCode: creds.accountCountryCode || "EG",
        version: "v1.0",
      });
    }

    case "MYLERZ": {
      const creds = credentials as unknown as MylerzCredentials;
      if (!creds.username || !creds.password) throw new Error("Mylerz: username and password are required");
      return new MylerzProvider({ username: creds.username, password: creds.password, warehouse: creds.warehouse });
    }

    default:
      return null;
  }
}
