import { readFileSync } from "fs";
import { sha256 } from "@noble/hashes/sha256";
import { hexToBytes } from "@noble/hashes/utils";
import { secp256k1 } from "@noble/curves/secp256k1";

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

// secp256k1.sign returns a Signature object; get compact 64-byte form
const sig = secp256k1.sign(digest, privBytes).toCompactRawBytes();

console.log("0x" + Buffer.from(sig).toString("hex"));