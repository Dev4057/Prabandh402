// What it does: /booking endpoint that returns a signed 402-style payload (amount, token, network, payment address, nonce, expiry, callback URL, facilitator URL, host) with HTTP status 402.
// Real-world role: Represents a payable API call: provider tells the agent “pay this amount to this address under these terms,” signed by the provider’s attestation key.



// What? Endpoint that the agent calls to book a service.
// What it does:
// Checks the info the agent sends,
// Prepares a “cost and instructions” (how much, where to pay, etc.),
// Signs the info with the provider's secret key,
// Sends a HTTP 402 (Payment Required) status with those details.
// Why?
// In real-world booking: "Here’s your invoice, and proof I wrote this—pay me to this address."
// Links?
// Uses cryptography from crypto.ts to sign the offer.

import { FastifyInstance } from "fastify";
import { signPayload } from "../crypto.js";
import { randomUUID } from "crypto";

export async function bookingRoutes(app: FastifyInstance) {
  app.post("/booking", async (req, reply) => {
    // Demo payload; normally derived from request body (e.g., slot, depot)
    const bookingId = "bk_" + randomUUID();
    const nonce = "n-" + randomUUID();
    const payload = {
      booking_id: bookingId,
      network: process.env.PROVIDER_NETWORK || "sepolia",
      token: process.env.PROVIDER_TOKEN_ADDRESS,
      amount: "12.50",
      payment_address: process.env.PROVIDER_PAYMENT_ADDRESS,
      nonce,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      callback_url: `${process.env.PROVIDER_CALLBACK_URL || "http://localhost:4001/payment/confirm"}`,
      facilitator_url: process.env.FACILITATOR_URL || "http://localhost:4002",
      host: process.env.PROVIDER_HOST,
    };

    const signature = await signPayload(payload, process.env.PROVIDER_ATTESTATION_PRIVATE_KEY!);

    return reply
      .code(402) // semantic 402; Fastify will still send body
      .send({ ...payload, signature });
  });
}