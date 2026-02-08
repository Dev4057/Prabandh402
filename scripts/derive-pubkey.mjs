import { secp256k1 } from "@noble/curves/secp256k1.js";

function hexToBytes(hex) {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return arr;
}

const privHex = process.env.ATTESTATION_PRIV?.replace(/^0x/, "");
if (!privHex) throw new Error("Set ATTESTATION_PRIV");

const privBytes = hexToBytes(privHex);
const pub = secp256k1.getPublicKey(privBytes, true);
console.log("public_key:", "0x" + Buffer.from(pub).toString("hex"));