import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./registry/src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.REGISTRY_DB_URL!,
  },
});