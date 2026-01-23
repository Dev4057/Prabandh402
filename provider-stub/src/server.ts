// What it does: Boots the provider stub server, healthcheck, booking (402) route, and callback route.
// Real-world role: Runs the provider service exposing the payable endpoint and receipt flow.
import Fastify from "fastify";
import { bookingRoutes } from "./routes/booking";
import { callbackRoutes } from "./routes/callback";

export async function buildServer() {
  const app = Fastify({ logger: true });
  app.get("/health", async () => ({ ok: true }));
  app.register(bookingRoutes);
  app.register(callbackRoutes);
  return app;
}

if (require.main === module) {
  (async () => {
    const app = await buildServer();
    const port = Number(process.env.PROVIDER_PORT || 4001);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Provider running on ${port}`);
  })();
}