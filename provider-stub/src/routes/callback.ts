// What it does: /payment/confirm endpoint that accepts a tx hash + booking context, mocks a payment check, and returns a signed receipt.
// Real-world role: Provider-side confirmation webhook: after seeing payment, it issues a signed receipt the agent can trust. In Phase 1 the payment check is mocked; later it should verify on-chain.
import { FastifyInstance } from "fastify";
import { signPayload } from "../crypto";

interface CallbackBody {
  tx_hash: string;
  booking_id: string;
  nonce: string;
  amount: string;
}

export async function callbackRoutes(app: FastifyInstance) {
  app.post<{ Body: CallbackBody }>("/payment/confirm", async (req, reply) => {
    // Phase 1: mock verification; assume tx is valid if amount matches.
    const { tx_hash, booking_id, nonce, amount } = req.body;
    const expectedAmount = "12.50";
    if (amount !== expectedAmount) {
      return reply.code(400).send({ error: "amount_mismatch" });
    }

    const receipt = {
      booking_id,
      status: "confirmed",
      tx_hash,
      nonce,
      amount,
      issued_at: new Date().toISOString(),
    };

    const signature = await signPayload(receipt, process.env.PROVIDER_ATTESTATION_PRIVATE_KEY!);
    return reply.send({ receipt, signature });
  });
}