import { getPublicKey } from "@noble/secp256k1";
import { hexToBytes } from "@noble/hashes/utils";

const privHex = process.env.ATTESTATION_PRIV?.replace(/^0x/, "");
if (!privHex) throw new Error("Set ATTESTATION_PRIV");

const privBytes = hexToBytes(privHex);          // convert hex -> Uint8Array
const pub = getPublicKey(privBytes, true);      // compressed
console.log("public_key:", "0x" + Buffer.from(pub).toString("hex"));