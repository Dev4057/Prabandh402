// Deletes all SID rows from the registry DB, then exits.
// Run: npm run seed:reset  (wipes + re-seeds in one go)
// Or:  npm run db:wipe     (wipe only)

import "dotenv/config";
import postgres from "postgres";

const dbUrl = process.env.REGISTRY_DB_URL ?? "postgres://postgres:postgres@localhost:5432/registry";
const sql = postgres(dbUrl);

const rows = await sql`SELECT count(*) AS count FROM sids`;
const count = rows[0]?.count ?? 0;
await sql`DELETE FROM sids`;
console.log(`Wiped ${count} SID rows from registry.`);
await sql.end();
