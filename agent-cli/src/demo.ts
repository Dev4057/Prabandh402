// Agent demo: discovers all providers, quotes all, picks cheapest, books → pays → verifies receipt.
// Emits structured events to the Event Hub so the dashboard can render the flow live.
// Loops indefinitely (Ctrl+C to stop).

import "dotenv/config";
import { verifyPayload } from "../../provider-stub/src/crypto.js";
import { Sid } from "../../registry/src/sid.js";
import {
  createWalletClient,
  http,
  publicActions,
  encodeFunctionData,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// ── Config ──────────────────────────────────────────────────────────────────
const REGISTRY_URL  = process.env.AGENT_REGISTRY_URL  ?? "http://localhost:4000";
const EVENT_HUB_URL = process.env.EVENT_HUB_URL       ?? "http://localhost:4010";
const LOOP_DELAY_MS = Number(process.env.DEMO_LOOP_DELAY_MS ?? 12_000);

// ── Event emitter ────────────────────────────────────────────────────────────
async function emit(type: string, message: string, extra: Record<string, unknown> = {}) {
  try {
    await fetch(`${EVENT_HUB_URL}/event`, {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ type, message, ...extra }),
    });
  } catch {
    // Event hub might not be running; demo still works
  }
  console.log(`[${type}] ${message}`);
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── ERC-20 ABI (transfer only) ───────────────────────────────────────────────
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount",    type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type SidRow = { payload: Sid };

type Quote = {
  sid:     Sid;
  booking: Record<string, string>;
};

// ── Main booking round ────────────────────────────────────────────────────────
async function runBookingRound() {
  // ── Step 1: Discover ──────────────────────────────────────────────────────
  await emit("discovery", "Agent scanning registry for available providers…");

  const rows: SidRow[] = await fetch(`${REGISTRY_URL}/search`)
    .then((r) => r.json())
    .catch(() => []);

  if (!rows.length) {
    await emit("error", "No providers found in registry. Run: npm run seed");
    return;
  }

  await emit("discovery", `Found ${rows.length} provider(s) in registry.`);

  // ── Step 2: Quote all providers in parallel ───────────────────────────────
  await emit("step", `Requesting quotes from all ${rows.length} providers…`, { step: "quote" });

  const quoteResults = await Promise.all(
    rows.map(async (row): Promise<Quote | null> => {
      const sid = row.payload;
      const providerUrl = sid.hosts[0];
      try {
        const resp = await fetch(`${providerUrl}/booking`, { method: "POST" });
        const booking: Record<string, string> = await resp.json();
        return { sid, booking };
      } catch {
        return null;
      }
    })
  );

  // Filter out failed requests and verify all signatures
  const validQuotes: Quote[] = [];
  for (const q of quoteResults) {
    if (!q) continue;
    const { sid, booking } = q;
    const sigOk = await verifyPayload(
      {
        booking_id:      booking.booking_id,
        network:         booking.network,
        token:           booking.token,
        amount:          booking.amount,
        payment_address: booking.payment_address,
        nonce:           booking.nonce,
        expires_at:      booking.expires_at,
        callback_url:    booking.callback_url,
        facilitator_url: booking.facilitator_url,
        host:            booking.host,
      },
      booking.signature,
      sid.verification.public_key
    );
    if (sigOk) {
      validQuotes.push(q);
    } else {
      await emit("error", `Signature INVALID from ${sid.service_id} — skipping.`);
    }
  }

  if (!validQuotes.length) {
    await emit("error", "No providers passed signature verification.");
    return;
  }

  await emit("signature_verified",
    `${validQuotes.length}/${rows.length} providers passed signature verification ✓`,
    { verified: validQuotes.length, total: rows.length }
  );

  // ── Step 3: Pick cheapest ─────────────────────────────────────────────────
  validQuotes.sort((a, b) => parseFloat(a.booking.amount) - parseFloat(b.booking.amount));
  const best = validQuotes[0];
  const { sid, booking } = best;

  await emit("provider_selected",
    `Best price: ${sid.service_id} @ ${booking.amount} USDC (cheapest of ${validQuotes.length})`,
    { service_id: sid.service_id, amount: booking.amount }
  );

  // ── Step 4: Pay ───────────────────────────────────────────────────────────
  await emit("payment",
    `Initiating payment: ${booking.amount} USDC → ${booking.payment_address}`,
    { step: "pay", service_id: sid.service_id, amount: booking.amount }
  );

  let txHash = "0x" + "ab".repeat(32); // mock fallback

  if (process.env.AGENT_PAYMENT_PRIVATE_KEY) {
    try {
      const account = privateKeyToAccount(
        process.env.AGENT_PAYMENT_PRIVATE_KEY as `0x${string}`
      );
      const client = createWalletClient({
        account,
        chain:     baseSepolia,
        transport: http(),
      }).extend(publicActions);

      await emit("payment",
        `Executing on-chain transfer from ${account.address}…`,
        { service_id: sid.service_id }
      );

      const hash = await client.sendTransaction({
        to:   booking.token as `0x${string}`,
        data: encodeFunctionData({
          abi:          ERC20_TRANSFER_ABI,
          functionName: "transfer",
          args:         [
            booking.payment_address as `0x${string}`,
            parseUnits(booking.amount, 6),
          ],
        }),
      });

      const receipt = await client.waitForTransactionReceipt({ hash });
      txHash = receipt.transactionHash;

      await emit("payment",
        `On-chain tx confirmed in block ${receipt.blockNumber}: ${txHash.slice(0, 18)}…`,
        { service_id: sid.service_id, tx_hash: txHash }
      );
    } catch (e: any) {
      await emit("payment",
        `On-chain payment failed (${e.message}). Falling back to mock tx hash.`,
        { service_id: sid.service_id }
      );
    }
  } else {
    await emit("payment",
      `No AGENT_PAYMENT_PRIVATE_KEY set — using mock tx hash for demo.`,
      { service_id: sid.service_id }
    );
  }

  // ── Step 5: Send confirmation → get signed receipt ────────────────────────
  await emit("step", `Sending payment confirmation to ${sid.service_id}…`,
    { step: "receipt", service_id: sid.service_id });

  let callbackData: { receipt: Record<string, string>; signature: string };
  try {
    const callbackResp = await fetch(booking.callback_url, {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({
        tx_hash:    txHash,
        booking_id: booking.booking_id,
        nonce:      booking.nonce,
        amount:     booking.amount,
      }),
    });
    callbackData = await callbackResp.json();
  } catch (e: any) {
    await emit("error", `Callback request failed: ${e.message}`);
    return;
  }

  // ── Step 6: Verify receipt signature ─────────────────────────────────────
  const receiptOk = await verifyPayload(
    callbackData.receipt,
    callbackData.signature,
    sid.verification.public_key
  );

  if (!receiptOk) {
    await emit("error", `Receipt signature INVALID — do not trust this provider.`);
    return;
  }

  await emit("signature_verified",
    `Receipt signature verified ✓`,
    { service_id: sid.service_id }
  );

  await emit("booking_complete",
    `✓ Booking confirmed with ${sid.service_id} — tx: ${txHash.slice(0, 18)}…`,
    { service_id: sid.service_id, amount: booking.amount, tx_hash: txHash }
  );
}

// ── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Prabandh402 Agent Demo — Cheapest-Wins");
  console.log(`  Registry : ${REGISTRY_URL}`);
  console.log(`  Event Hub: ${EVENT_HUB_URL}`);
  console.log(`  Interval : ${LOOP_DELAY_MS / 1000}s between rounds`);
  console.log("  Dashboard: http://localhost:4010");
  console.log("  Stop with Ctrl+C");
  console.log("═══════════════════════════════════════════\n");

  while (true) {
    console.log("\n────────────── New Round ──────────────");
    try {
      await runBookingRound();
    } catch (err: any) {
      await emit("error", `Unexpected error: ${err.message}`);
    }
    console.log(`\nWaiting ${LOOP_DELAY_MS / 1000}s before next round…`);
    await sleep(LOOP_DELAY_MS);
  }
}

main();
