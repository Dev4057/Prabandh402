// What it does: Signing and verifying helpers for arbitrary payloads using stable stringify + secp256k1.
// Real-world role: Lets the provider sign 402 payloads and receipts with its attestation key; lets clients verify them.

import { sign, verify } from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { stableStringify } from "../../registry/src/utils/stableStringify"; // reuse helper

export async function signPayload(payload: any, privKeyHex: string): Promise<string> {
  const msg = stableStringify(payload);
  const sig = await sign(sha256(new TextEncoder().encode(msg)), privKeyHex, { der: false });
  return "0x" + Buffer.from(sig).toString("hex");
}

export async function verifyPayload(payload: any, signatureHex: string, pubKeyHex: string): Promise<boolean> {
  const msg = stableStringify(payload);
  const sigBytes = Buffer.from(signatureHex.replace(/^0x/, ""), "hex");
  return verify(sigBytes, sha256(new TextEncoder().encode(msg)), pubKeyHex.replace(/^0x/, ""));
}