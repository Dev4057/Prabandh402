import Fastify from "fastify";
import cors from "@fastify/cors";
import type { FastifyReply } from "fastify";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dashboardHtml = readFileSync(resolve(__dirname, "../../dashboard/index.html"), "utf-8");

interface AgentEvent {
  type: string;
  message: string;
  timestamp: string;
  service_id?: string;
  amount?: string;
  tx_hash?: string;
  [key: string]: unknown;
}

const app = Fastify({ logger: false });
const events: AgentEvent[] = [];
const clients: FastifyReply[] = [];

await app.register(cors, { origin: true });

// Agent/provider posts events here
app.post<{ Body: Omit<AgentEvent, "timestamp"> }>("/event", async (req, reply) => {
  const event: AgentEvent = { ...req.body, timestamp: new Date().toISOString() };
  events.push(event);
  // Keep last 200 events only
  if (events.length > 200) events.shift();

  for (const client of clients) {
    try {
      client.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // client disconnected
    }
  }
  return reply.send({ ok: true });
});

// SSE stream endpoint for the dashboard
app.get("/events/stream", async (req, reply) => {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Replay last 50 events on connect
  for (const ev of events.slice(-50)) {
    reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
  }

  clients.push(reply);

  const heartbeat = setInterval(() => {
    try {
      reply.raw.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.raw.on("close", () => {
    clearInterval(heartbeat);
    const i = clients.indexOf(reply);
    if (i !== -1) clients.splice(i, 1);
  });

  // Hold connection open indefinitely
  await new Promise<void>((resolve) => req.raw.on("close", resolve));
});

// REST endpoint to fetch all events (for initial load)
app.get("/events", async () => events);

// Clear all events (useful between demo runs)
app.delete("/events", async () => {
  events.length = 0;
  return { ok: true };
});

app.get("/health", async () => ({ ok: true, clients: clients.length, events: events.length }));

// Serve the dashboard HTML at root
app.get("/", async (_req, reply) => {
  reply.header("Content-Type", "text/html; charset=utf-8");
  return reply.send(dashboardHtml);
});

const port = Number(process.env.EVENT_HUB_PORT || 4010);
await app.listen({ port, host: "0.0.0.0" });
console.log(`Event Hub + Dashboard → http://localhost:${port}`);
