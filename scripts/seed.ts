// Registers 3 demo provider SIDs into the running registry.
// Run: tsx scripts/seed.ts
// Requires the registry to be running on AGENT_REGISTRY_URL (default http://localhost:4000)

import "dotenv/config";
import { randomUUID } from "crypto";
import { signSid, derivePublicKey } from "../registry/src/sid.js";
import type { Sid } from "../registry/src/sid.js";

const REGISTRY_URL = process.env.AGENT_REGISTRY_URL ?? "http://localhost:4000";

// USDC on Base Sepolia (standard address)
const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Demo-only private keys — DO NOT use on mainnet.
// Derived from well-known Anvil/Hardhat dev accounts.
const PROVIDERS = [
  {
    service_id:      "fastship-express",
    display_name:    "FastShip Express",
    private_key:     process.env.PROVIDER_1_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    payment_address: process.env.PROVIDER_1_PAYMENT_ADDRESS ?? "0x988c50E5ad6371c4306Af520776bF7aC3246984A",
    capabilities:   ["freight", "last-mile", "express"],
    host:            "http://localhost:4001",
    amount:          "0.010",
  },
  {
    service_id:      "quickfreight-ltd",
    display_name:    "QuickFreight Ltd",
    // Anvil account #1 — demo only
    private_key:     process.env.PROVIDER_2_PRIVATE_KEY ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    payment_address: "0x240503ED0B69515c8239F17735807bA73b4C798B",
    capabilities:   ["freight", "customs-clearance", "bulk"],
    host:            "http://localhost:4002",
    amount:          "0.008",
  },
  {
    service_id:      "globalmove-co",
    display_name:    "GlobalMove Co.",
    // Anvil account #2 — demo only
    private_key:     process.env.PROVIDER_3_PRIVATE_KEY ?? "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    payment_address: "0x4ff39F71CbD38b49f1013953b51708341263914b",
    capabilities:   ["freight", "warehousing", "international"],
    host:            "http://localhost:4003",
    amount:          "0.012",
  },
] as const;

async function register(p: typeof PROVIDERS[number]) {
  const public_key = derivePublicKey(p.private_key);

  const sid: Sid = {
    service_id:   p.service_id,
    hosts:        [p.host],
    capabilities: [...p.capabilities],
    payment: {
      network: "base-sepolia",
      token:   USDC,
      address: p.payment_address,
    },
    verification: { public_key },
    expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    nonce:  randomUUID(),
  };

  const signature = await signSid(sid, p.private_key);

  const resp = await fetch(`${REGISTRY_URL}/sid`, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    JSON.stringify({ sid, signature }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error(`✗ Failed to register ${p.display_name}: HTTP ${resp.status} — ${body}`);
    return;
  }

  const result = await resp.json() as { sig_valid: boolean; dns_ok: boolean };
  console.log(
    `✓ ${p.display_name.padEnd(20)} │ sig_valid=${result.sig_valid} │ pubkey=${public_key.slice(0,12)}… │ payment=${p.payment_address}`
  );
}

async function main() {
  console.log(`\nSeeding providers → ${REGISTRY_URL}\n`);
  for (const p of PROVIDERS) {
    await register(p);
  }
  console.log("\nAll providers registered. Open http://localhost:4011 to view the dashboard.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
