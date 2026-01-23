// What it does:
// Defines the SID schema (service_id, hosts, capabilities, payment, attestation public key, expiry, nonce).
// Provides signSid / verifySid using secp256k1 + a stable hash.
// Provides derivePublicKey from a private key (for convenience).
// Real-world role: Validates and signs your Service Identity Document so callers can cryptographically trust who you are (host/key/payment binding).

import { z } from "zod";
import { stableStringify } from "./utils/stableStringify";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";

// Zod schema for the Service Identity Document (SID).
export const SidSchema = z.object({
  service_id: z.string().min(1),
  hosts: z.array(z.string().url()).nonempty(),
  capabilities: z.array(z.string()).nonempty(),
  payment: z.object({
    network: z.string().min(1),
    token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  }),
  verification: z.object({
    public_key: z.string().regex(/^0x[0-9a-fA-F]{66}$/), // compressed secp256k1
  }),
  expiry: z.string().datetime(),
  nonce: z.string().min(1),
});

export type Sid = z.infer<typeof SidSchema>;

// Create a detached signature over stable-stringified SID.
export async function signSid(sid: Sid, privKeyHex: string): Promise<string> {
  const message = stableStringify(sid);
  const digest = messageHash(message); // 32-byte hash
  const privBytes = hexToBytes(privKeyHex.replace(/^0x/, ""));
  const sig = secp256k1.sign(digest, privBytes).toCompactRawBytes(); // 64-byte compact
  return "0x" + Buffer.from(sig).toString("hex");
}

// Verify SID signature against the embedded public key.
export async function verifySid(sid: Sid, signatureHex: string): Promise<boolean> {
  const message = stableStringify(sid);
  const digest = messageHash(message);
  const sigBytes = Buffer.from(signatureHex.replace(/^0x/, ""), "hex");
  const pubBytes = Buffer.from(sid.verification.public_key.replace(/^0x/, ""), "hex");
  return secp256k1.verify(sigBytes, digest, pubBytes);
}

// Simple hash helper (sha256) for string messages.
function messageHash(message: string): Uint8Array {
  return sha256(new TextEncoder().encode(message));
}

// Convenience to derive compressed public key from private key.
export function derivePublicKey(privKeyHex: string): string {
  const privBytes = hexToBytes(privKeyHex.replace(/^0x/, ""));
  const pub = secp256k1.getPublicKey(privBytes, true);
  return "0x" + Buffer.from(pub).toString("hex");
}

// Local hex -> bytes helper.
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}