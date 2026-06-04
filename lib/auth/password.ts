/**
 * Argon2id password hashing with transparent bcrypt migration.
 *
 * New passwords  → hashed with argon2id (stored with algo = "argon2id")
 * Legacy bcrypt  → verified with bcryptjs, then re-hashed with argon2id on
 *                  next successful login (zero downtime migration)
 *
 * Hash format sentinel:
 *   argon2id hashes start with "$argon2id$"
 *   bcrypt hashes start with "$2b$" or "$2a$"
 */

import argon2 from "argon2";
import bcrypt from "bcryptjs";

// OWASP-recommended Argon2id parameters (2024)
const ARGON2_OPTIONS: argon2.Options & { type: typeof argon2.argon2id } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Argon2id hash
  if (hash.startsWith("$argon2")) {
    const valid = await argon2.verify(hash, password);
    const needsRehash = valid && argon2.needsRehash(hash, ARGON2_OPTIONS);
    return { valid, needsRehash };
  }

  // Legacy bcrypt hash — verify then signal for rehash
  if (hash.startsWith("$2b$") || hash.startsWith("$2a$")) {
    const valid = await bcrypt.compare(password, hash);
    return { valid, needsRehash: valid }; // always rehash on success
  }

  return { valid: false, needsRehash: false };
}

export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}
