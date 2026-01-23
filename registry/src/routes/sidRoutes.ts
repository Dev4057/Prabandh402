// POST /sid to submit/update a SID, verify its signature, run DNS check, and store trust flags.
// GET /sid/:service_id to fetch a specific SID row.
// GET /search to list all SIDs (simple search stub).
// Real-world role: The registry API where providers publish their identity and agents discover it with trust metadata.


import { FastifyInstance } from "fastify";
import { SidSchema, verifySid, Sid } from "../sid";
import { checkDnsTxt } from "../trust/dnsCheck";
import { sids } from "../db/schema";
import { eq } from "drizzle-orm";

interface SidBody {
  sid: Sid;
  signature: string;
}

export async function sidRoutes(app: FastifyInstance) {
  // Submit SID
  app.post<{ Body: SidBody }>("/sid", async (req, reply) => {
    const parsed = SidSchema.parse(req.body.sid);
    const signature = req.body.signature;
    const sigOk = await verifySid(parsed, signature);
    const dns = await checkDnsTxt({
      host: parsed.hosts[0],
      expectedPublicKey: parsed.verification.public_key,
      expectedPayment: parsed.payment.address,
    });

    await app.db
      .insert(sids)
      .values({
        service_id: parsed.service_id,
        payload: parsed,
        signature,
        sig_valid: String(sigOk),
        dns_ok: String(dns.ok),
        anchor_ok: "unknown",
      })
      .onConflictDoUpdate({
        target: sids.service_id,
        set: {
          payload: parsed,
          signature,
          sig_valid: String(sigOk),
          dns_ok: String(dns.ok),
          anchor_ok: "unknown",
        },
      });

    return reply.send({
      service_id: parsed.service_id,
      sig_valid: sigOk,
      dns_ok: dns.ok,
      anchor_ok: false,
    });
  });

  // Get by service_id
  app.get<{ Params: { service_id: string } }>("/sid/:service_id", async (req, reply) => {
    const rows = await app.db.select().from(sids).where(eq(sids.service_id, req.params.service_id));
    if (!rows.length) return reply.code(404).send({ error: "not found" });
    return reply.send(rows[0]);
  });

  // Simple search by capability substring
  app.get("/search", async (req, reply) => {
    const rows = await app.db.select().from(sids);
    return reply.send(rows);
  });
}