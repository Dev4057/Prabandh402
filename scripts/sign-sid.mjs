import { readFileSync } from "fs";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";

function hexToBytes(hex) {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return arr;
}

function stableStringify(obj) {
  return JSON.stringify(sort(obj));
  function sort(v) {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      return Object.keys(v).sort().reduce((a, k) => {
        a[k] = sort(v[k]);
        return a;
      }, {});
    }
    return v;
  }
}

const privHex = process.env.ATTESTATION_PRIV?.replace(/^0x/, "");
if (!privHex) throw new Error("Set ATTESTATION_PRIV");

const raw = readFileSync(process.argv[2], "utf8").replace(/^\uFEFF/, "");
const sid = JSON.parse(raw).sid;
const msg = stableStringify(sid);

const digest = sha256(new TextEncoder().encode(msg)); // 32-byte hash
const privBytes = hexToBytes(privHex);

// secp256k1.sign returns a Uint8Array in v2
const sig = secp256k1.sign(digest, privBytes);

console.log("0x" + Buffer.from(sig).toString("hex"));