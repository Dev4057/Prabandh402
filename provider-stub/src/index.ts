import Fastify from "fastify";
import dotenv from "dotenv";
dotenv.config();

const app = Fastify({ logger: true });
const port = Number(process.env.PROVIDER_PORT || 4001);

app.get("/health", async () => ({ status: "ok" }));

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});