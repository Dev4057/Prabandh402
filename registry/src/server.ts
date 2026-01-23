// What it does: Boots the registry server, wires DB, healthcheck, and SID routes.
// Real-world role: Runs the registry service (identity directory) on the configured port.


import Fastify from "fastify";
import { sidRoutes } from "./routes/sidRoutes";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export async function buildServer() {
  const app = Fastify({ logger: true });

  const pool = new Pool({ connectionString: process.env.REGISTRY_DB_URL });
  app.decorate("db", drizzle(pool));

  app.get("/health", async () => ({ ok: true }));
  app.register(sidRoutes);

  return app;
}

if (require.main === module) {
  (async () => {
    const app = await buildServer();
    const port = Number(process.env.REGISTRY_PORT || 4000);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Registry running on ${port}`);
  })();
}