// What it does: Boots the registry server, wires DB, healthcheck, and SID routes.
// Real-world role: Runs the registry service (identity directory) on the configured port.


import Fastify from "fastify";
import dotenv from "dotenv";
import { sidRoutes } from "./routes/sidRoutes";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export async function buildServer() {
  dotenv.config();

  const dbUrl = process.env.REGISTRY_DB_URL;
  if (!dbUrl) {
    throw new Error("REGISTRY_DB_URL is not set; check your .env");
  }

  const app = Fastify({ logger: true });

  const pool = new Pool({ connectionString: dbUrl });
  app.decorate("db", drizzle(pool));

  app.get("/health", async () => ({ ok: true }));
  app.register(sidRoutes);

  return app;
}

// ESM-friendly entrypoint check
if (import.meta.main) {
  (async () => {
    const app = await buildServer();
    const port = Number(process.env.REGISTRY_PORT || 4000);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Registry running on ${port}`);
  })();
}