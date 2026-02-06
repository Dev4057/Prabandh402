// What it does: Signs and verifies provider payloads with secp256k1.
// Real-world role: Provider proves authenticity of 402 requests and receipts.

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { stableStringify } from "../../registry/src/utils/stableStringify.js";

export async function signPayload(payload: any, privKeyHex: string): Promise<string> {
  const msg = stableStringify(payload);  // ✅ Deterministic
  const digest = sha256(new TextEncoder().encode(msg));
  const privBytes = hexToBytes(privKeyHex.replace(/^0x/, ""));
  const sig = secp256k1.sign(digest, privBytes);
  return "0x" + Buffer.from(sig).toString("hex");
}

export async function verifyPayload(payload: any, signatureHex: string, pubKeyHex: string): Promise<boolean> {
  const msg = JSON.stringify(payload);
  const digest = sha256(new TextEncoder().encode(msg));
  const sigBytes = Buffer.from(signatureHex.replace(/^0x/, ""), "hex");
  const pubBytes = Buffer.from(pubKeyHex.replace(/^0x/, ""), "hex");
  return secp256k1.verify(sigBytes, digest, pubBytes);
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}