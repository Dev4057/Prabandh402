// What it does: A CLI script that drives the happy path:
// Fetches a SID from the registry.
// Calls provider /booking to get a signed 402 payload.
// Verifies the 402 signature with the SID public key.
// Mocks payment (produces a fake tx hash) and calls the provider callback.
// Verifies the provider’s signed receipt.
// Real-world role: Minimal agent discovery → trust verification → payment ask → “payment” → receipt verification.

import { verifyPayload } from "../../provider-stub/src/crypto.js";
import { Sid } from "../../registry/src/sid.js";

type SidRow = { payload: Sid };

async function main() {
  const registryUrl = process.env.AGENT_REGISTRY_URL || "http://localhost:4000";
  const providerUrl = process.env.AGENT_PROVIDER_URL || "http://localhost:4001";

  console.log("1) Fetch SID from registry");
  const sidRow = await fetch(`${registryUrl}/search`)
    .then((r) => r.json())
    .then((rows: SidRow[]) => rows[0]);
  if (!sidRow) throw new Error("No SID in registry; submit one first.");
  const sid: Sid = sidRow.payload;
  console.log("   service_id:", sid.service_id);

  console.log("2) Call provider /booking to get 402 payload");
  const bookingResp = await fetch(`${providerUrl}/booking`, { method: "POST" });
  const booking = await bookingResp.json();
  console.log("   402 payload:", booking);

  console.log("3) Verify 402 signature with SID public key");
  const ok = await verifyPayload(
    {
      booking_id: booking.booking_id,
      network: booking.network,
      token: booking.token,
      amount: booking.amount,
      payment_address: booking.payment_address,
      nonce: booking.nonce,
      expires_at: booking.expires_at,
      callback_url: booking.callback_url,
      facilitator_url: booking.facilitator_url,
      host: booking.host,
    },
    booking.signature,
    sid.verification.public_key
  );
  if (!ok) throw new Error("402 signature invalid");
  console.log("   402 signature valid ✓");

  console.log("4) Mock payment (Phase 1) and call callback");
  const mockTxHash = "0x" + "ab".repeat(32);
  const callbackResp = await fetch(booking.callback_url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tx_hash: mockTxHash,
      booking_id: booking.booking_id,
      nonce: booking.nonce,
      amount: booking.amount,
    }),
  });
  const callback = await callbackResp.json();
  console.log("   receipt payload:", callback);

  console.log("5) Verify receipt signature");
  const receiptOk = await verifyPayload(callback.receipt, callback.signature, sid.verification.public_key);
  if (!receiptOk) throw new Error("Receipt signature invalid");
  console.log("   Receipt signature valid ✓");
  console.log("Demo complete: booking confirmed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});