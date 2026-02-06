// What it does: Boots the provider stub server, healthcheck, booking (402) route, and callback route.
// Real-world role: Runs the provider service exposing the payable endpoint and receipt flow.
import Fastify from "fastify";
import dotenv from "dotenv";
import { bookingRoutes } from "./routes/booking.js";
import { callbackRoutes } from "./routes/callback.js";
import { fileURLToPath } from "url";

export async function buildServer() {
  dotenv.config();

  const required = [
    "PROVIDER_PAYMENT_ADDRESS",
    "PROVIDER_TOKEN_ADDRESS",
    "PROVIDER_ATTESTATION_PRIVATE_KEY",
    "PROVIDER_HOST",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  const app = Fastify({ logger: true });
  app.get("/health", async () => ({ ok: true }));
  app.register(bookingRoutes);
  app.register(callbackRoutes);
  return app;
}

// ESM-friendly entrypoint check
if (import.meta.main) {
  (async () => {
    const app = await buildServer();
    const port = Number(process.env.PROVIDER_PORT || 4001);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Provider running on ${port}`);
  })();
}


// ESM-friendly entrypoint check for Node.js
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  (async () => {
    const app = await buildServer();
    const port = Number(process.env.PROVIDER_PORT || 4001);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Provider running on ${port}`);
  })();
}