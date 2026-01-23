// What it does: Drizzle schema for the sids table: stores SID payload, signature, trust flags (sig_valid, dns_ok, anchor_ok), timestamps.
// Real-world role: Persists published SIDs plus their trust status so agents can discover and reuse them.



import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const sids = pgTable("sids", {
  service_id: text("service_id").primaryKey(),
  payload: jsonb("payload").notNull(),    // stored SID
  signature: text("signature").notNull(),
  sig_valid: text("sig_valid").notNull(), // "true"/"false"
  dns_ok: text("dns_ok").notNull(),       // "true"/"false"/"unknown"
  anchor_ok: text("anchor_ok").notNull(), // placeholder for future
  created_at: timestamp("created_at").defaultNow().notNull(),
});