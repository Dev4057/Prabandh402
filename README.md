# Prabandh402

> **Agent-Native Logistics Transaction Layer** — Enabling AI systems to autonomously discover, verify, and book real-world logistics services using cryptographic service identity (EIP-8004) and instant HTTP-native payments (x402).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.7-green.svg)](https://www.fastify.io/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Product in One Sentence](#-product-in-one-sentence)
- [The Problem](#-the-problem)
- [How It's Solved Today](#-how-its-solved-today)
- [Our Solution](#-our-solution)
- [Two Protocols, One System](#-two-protocols-one-system)
- [Architecture](#-architecture)
- [The Complete Flow](#-the-complete-flow)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Security Model](#-security-model)
- [Roadmap](#-roadmap)

---

## 🎯 Product in One Sentence

**Prabandh402** is an agent-native logistics transaction layer that enables AI systems to autonomously discover, verify, and book real-world logistics services using **cryptographic service identity (EIP-8004)** and **instant HTTP-native payments (x402)**, without human intervention or intermediaries.

---

## 🔴 The Problem

Modern supply chains rely on manual discovery, trust, and payment processes that are **incompatible with autonomous AI systems**.

While AI can optimize routes, inventory, and demand forecasting, it **cannot**:

| Challenge | Why It's Blocked |
|-----------|------------------|
| **Verify legitimacy** | No way to confirm if a warehouse or logistics provider is who they claim to be |
| **Trust API endpoints** | No cryptographic proof that an API endpoint belongs to the claimed provider |
| **Execute payments** | Cross-company payments require human approval, contracts, and wire transfers |
| **Transact autonomously** | Existing systems depend on brokers, invoices, and centralized marketplaces |

**The Result:** Even simple logistics actions (like booking a warehouse slot) take **days** and require **human involvement**, making autonomous supply chain execution impossible.

---

## 🟡 How It's Solved Today

| Layer | Current Approach | Problems |
|-------|------------------|----------|
| **Discovery** | Centralized platforms, brokers, manual search | Slow, expensive, not machine-readable |
| **Trust** | Contracts, references, offline verification | Requires humans, days/weeks to establish |
| **Payment** | Invoicing, wire transfers, payment processors | Human approval, 3-5 day settlement, high fees |
| **Reputation** | Platform-specific ratings | Non-verifiable, easily manipulated, siloed |
| **Identity** | OAuth, API keys | No cryptographic link between service, endpoint, and payment address |

**Bottom line:** This approach works for humans, but it **does not scale** to autonomous agents or real-time supply chain automation.

---

## 🟢 Our Solution

Prabandh402 combines two complementary protocols to solve both **identity/trust** and **payment** challenges:

```
┌───────────────────────────────────────────────────────────────────── 
│                         PRABANDH402                                 │
│                                                                     │
│    ┌─────────────────────┐      ┌─────────────────────┐            │
│    │      EIP-8004       │      │        x402         │            │
│    │  (Identity Layer)   │  +   │  (Payment Layer)    │            │
│    │                     │      │                     │            │
│    │  • Service Identity │      │  • HTTP 402 Status  │            │
│    │  • Cryptographic    │      │  • Instant Payment  │            │
│    │    Verification     │      │  • Machine-Readable │            │
│    │  • DNS Binding      │      │  • No Intermediaries│            │
│    │  • On-chain Anchor  │      │  • Blockchain Settle│            │
│    └─────────────────────┘      └─────────────────────┘            │
│                                                                     │
│              WHO am I paying?    +    HOW do I pay?                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Two Protocols, One System

### EIP-8004: Service Identity Document (SID)

**Purpose:** Solve the **trust and identity** problem — *"Who am I dealing with?"*

EIP-8004 defines a standard for **cryptographic service identity** that binds:
- **Real-world service** (e.g., "ACME Warehouse in Mumbai")
- **API endpoints** (e.g., `https://api.acme-warehouse.com`)
- **Payment addresses** (e.g., `0x742d35Cc...`)
- **Attestation public key** (for signature verification)

```json
{
  "service_id": "acme-warehouse-mumbai",
  "hosts": ["https://api.acme-warehouse.com"],
  "capabilities": ["book_storage_slot", "check_availability"],
  "payment": {
    "network": "base",
    "token": "0xUSDC...",
    "address": "0x742d35Cc..."
  },
  "verification": {
    "public_key": "0x026e1ae39..."
  },
  "expiry": "2026-12-31T23:59:59Z",
  "nonce": "v1"
}
```

**Trust establishment:**
1. Provider signs SID with their attestation private key
2. Public key is published in DNS TXT record (domain binding)
3. SID hash is anchored on-chain (immutable record)
4. Registry verifies all three layers before indexing

**Result:** An AI agent can cryptographically verify that `api.acme-warehouse.com` **really belongs** to the entity that controls `0x742d35Cc...`

---

### x402: HTTP-Native Payment Protocol

**Purpose:** Solve the **payment execution** problem — *"How do I pay instantly?"*

x402 introduces machine-to-machine payments using the HTTP 402 status code:

```
Agent                              Provider
  │                                    │
  │──── POST /book-slot ──────────────▶│
  │                                    │
  │◀─── HTTP 402 Payment Required ─────│
  │     {                              │
  │       "amount": "50.00",           │
  │       "currency": "USDC",          │
  │       "network": "base",           │
  │       "payment_address": "0x...",  │
  │       "facilitator": "0x...",      │
  │       "expires_at": "..."          │
  │     }                              │
  │                                    │
  │──── [Execute blockchain payment] ──│
  │                                    │
  │──── POST /confirm {tx_hash} ──────▶│
  │                                    │
  │◀─── 200 OK + Signed Receipt ───────│
```

**Key benefits:**
- **Instant settlement** — No 3-5 day wire transfers
- **No intermediaries** — Direct provider-to-agent payment
- **Machine-readable** — Structured JSON, not HTML forms
- **Verifiable** — On-chain proof of payment

---

### How They Work Together

| Layer | Protocol | Question Answered |
|-------|----------|-------------------|
| **Identity & Trust** | EIP-8004 | *"Is this provider legitimate? Does this API really belong to them?"* |
| **Payment Execution** | x402 | *"How do I pay them instantly without human approval?"* |

**x402 alone** can execute payments, but the agent wouldn't know if it's paying a legitimate provider or a scammer.

**EIP-8004 alone** can verify identity, but the agent would still need manual payment processing.

**Together:** Autonomous, trustless, instant logistics transactions.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│    ┌─────────────────────────────────────────┐                          │
│    │         AI LOGISTIC AGENT               │                          │
│    │    (LLM Agent / Company System)         │                          │
│    └─────────────────┬───────────────────────┘                          │
│                      │                                                   │
│                      │ 1. Query/Request                                  │
│                      ▼                                                   │
│    ┌─────────────────────────────────────────┐                          │
│    │      SUPPLY CHAIN REGISTRY API          │                          │
│    │     (Discovery & Identity Layer)        │                          │
│    │                                         │                          │
│    │  • Indexes EIP-8004 Service Descriptors │                          │
│    │  • Verifies signatures & DNS binding    │                          │
│    │  • Machine-readable discovery API       │                          │
│    │  • Filters by location, capacity, etc.  │                          │
│    └─────────────────┬───────────────────────┘                          │
│                      │                                                   │
│                      │ 2. Select Provider (verified SID)                │
│                      ▼                                                   │
│    ┌─────────────────────────────────────────┐                          │
│    │         PROVIDER API                    │                          │
│    │    (Warehouse / Logistics Service)      │                          │
│    │                                         │                          │
│    │  • Check availability                   │                          │
│    │  • Get pricing                          │                          │
│    │  • Request booking                      │                          │
│    └─────────────────┬───────────────────────┘                          │
│                      │                                                   │
│                      │ 3. HTTP 402 Payment Required                     │
│                      ▼                                                   │
│    ┌─────────────────────────────────────────┐                          │
│    │         x402 PAYMENT LAYER              │                          │
│    │      (Facilitator / Verifier)           │                          │
│    │                                         │                          │
│    │  • Verify payment request signature     │                          │
│    │  • Execute blockchain transaction       │                          │
│    │  • Settle payment instantly             │                          │
│    │  • Optional: Escrow for disputes        │                          │
│    └─────────────────┬───────────────────────┘                          │
│                      │                                                   │
│                      │ 4. Confirmation                                   │
│                      ▼                                                   │
│    ┌────────────────────────────────────────┐                          │
│    │      BOOKING CONFIRMATION               │                          │
│    │    + Reputation Update Service          │                          │
│    │                                         │                          │
│    │  • Signed receipt as proof              │                          │
│    │  • On-chain transaction = reputation    │                          │
│    │  • Tamper-resistant history             │                          │
│    └─────────────────────────────────────────┘                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Protocol | Responsibility |
|-----------|----------|----------------|
| **AI Logistic Agent** | — | Autonomous system that needs to book logistics services |
| **Supply Chain Registry** | EIP-8004 | Indexes and verifies service identities, enables discovery |
| **Provider API** | EIP-8004 + x402 | Real logistics service (warehouse, freight, etc.) |
| **x402 Payment Layer** | x402 | Facilitates and verifies instant blockchain payments |
| **Reputation Service** | — | Updates provider reputation based on completed transactions |

---

## 🔄 The Complete Flow

### Step-by-Step Breakdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: SERVICE REGISTRATION (Provider Onboarding)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Provider                           Registry                            │
│     │                                  │                                │
│     │  1. Create SID (EIP-8004)        │                                │
│     │  2. Sign with attestation key    │                                │
│     │  3. Publish pubkey in DNS TXT    │                                │
│     │                                  │                                │
│     │──── POST /sid {sid, signature} ─▶│                                │
│     │                                  │                                │
│     │                    4. Verify signature ✓                          │
│     │                    5. Verify DNS binding ✓                        │
│     │                    6. Index in database                           │
│     │                                  │                                │
│     │◀─── { sig_valid, dns_ok } ───────│                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: SERVICE DISCOVERY (Agent finds providers)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent                              Registry                            │
│     │                                  │                                │
│     │──── GET /search?location=mumbai ▶│                                │
│     │          &capacity=1000sqft      │                                │
│     │          &type=warehouse         │                                │
│     │                                  │                                │
│     │◀─── [ SID[], with public keys ] ─│                                │
│     │                                  │                                │
│     │  Agent now has:                  │                                │
│     │  • Verified provider identities  │                                │
│     │  • API endpoints                 │                                │
│     │  • Payment addresses             │                                │
│     │  • Public keys for verification  │                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: SERVICE REQUEST (Agent contacts provider)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent                              Provider                            │
│     │                                  │                                │
│     │──── POST /booking ──────────────▶│                                │
│     │     { slot: "2026-02-10",        │                                │
│     │       duration: "7 days" }       │                                │
│     │                                  │                                │
│     │◀─── HTTP 402 Payment Required ───│  ◀── x402 PROTOCOL            │
│     │     {                            │                                │
│     │       booking_id: "bk_...",      │                                │
│     │       amount: "500.00",          │                                │
│     │       token: "USDC",             │                                │
│     │       network: "base",           │                                │
│     │       payment_address: "0x...",  │                                │
│     │       facilitator_url: "...",    │                                │
│     │       expires_at: "...",         │                                │
│     │       signature: "0x..."         │  ◀── Signed by provider        │
│     │     }                            │                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: VERIFICATION (Agent verifies before paying)                    │
��─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent (local verification)                                            │
│     │                                                                   │
│     │  1. Extract provider's public_key from SID (from Step 2)         │
│     │  2. Verify 402 payload signature against public_key              │
│     │  3. Confirm payment_address matches SID.payment.address          │
│     │  4. Check expiry hasn't passed                                   │
│     │                                                                   │
│     │  If all checks pass → Agent KNOWS:                               │
│     │  • This 402 came from the verified provider                      │
│     │  • The payment address is legitimate                             │
│     │  • It's safe to send money                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: PAYMENT EXECUTION (x402 flow)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent                 Facilitator              Blockchain              │
│     │                      │                        │                   │
│     │── Submit payment ───▶│                        │                   │
│     │   request + funds    │                        │                   │
│     │                      │                        │                   │
│     │                      │── Execute transfer ───▶│                   │
│     │                      │   (USDC on Base)       │                   │
│     │                      │                        │                   │
│     │                      │◀── tx_hash ────────────│                   │
│     │                      │                        │                   │
│     │◀── tx_hash ──────────│                        │                   │
│                                                                         │
│  Payment settled in seconds, not days.                                 │
│  No wire transfer. No invoice. No human approval.                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: CONFIRMATION & RECEIPT                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent                              Provider                            │
│     │                                  │                                │
│     │──── POST /payment/confirm ──────▶│                                │
│     │     { tx_hash, booking_id }      │                                │
│     │                                  │                                │
│     │              Provider verifies tx on-chain                        │
│     │                                  │                                │
│     │◀─── 200 OK + Signed Receipt ─────│                                │
│     │     {                            │                                │
│     │       receipt: {                 │                                │
│     │         booking_id, status,      │                                │
│     │         tx_hash, amount,         │                                │
│     │         issued_at                │                                │
│     │       },                         │                                │
│     │       signature: "0x..."         │  ◀── Proof of service          │
│     │     }                            │                                │
│     │                                  │                                │
│     │  Signed receipt = cryptographic proof                             │
│     │  • Provider cannot deny receiving payment                         │
│     │  • Can be used for disputes                                       │
│     │  • Updates provider reputation                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Prabandh402/
├── registry/                    # EIP-8004 Identity Registry
│   └── src/
│       ├── server.ts           # Fastify server bootstrap
│       ├── sid.ts              # SID schema, sign/verify (EIP-8004)
│       ├── db/
│       │   └── schema.ts       # Drizzle ORM schema (PostgreSQL)
│       ├── routes/
│       │   └── sidRoutes.ts    # POST /sid, GET /sid/:id, GET /search
│       ├── trust/
│       │   └── dnsCheck.ts     # DNS TXT verification
│       └── utils/
│           └── stableStringify.ts  # Deterministic JSON for signing
│
├── provider-stub/               # Example Logistics Provider
│   └── src/
│       ├── server.ts           # Fastify server bootstrap
│       ├── crypto.ts           # Sign/verify payloads (secp256k1)
│       └── routes/
│           ├── booking.ts      # POST /booking → HTTP 402 (x402)
│           └── callback.ts     # POST /payment/confirm → receipt
│
├── agent-cli/                   # Example AI Agent Client
│   └── src/
│       ├── index.ts            # Agent server
│       └── demo.ts             # End-to-end demo script
│
├── scripts/                     # Utility scripts
│   ├── sign-sid.mjs            # Sign a SID document
│   └── derive-pubkey.mjs       # Derive public key from private
│
├── drizzle.config.ts           # Database migration config
├── docker-compose.yml          # PostgreSQL + services
├── sid.json                    # Example SID document
├── package.json
├── tsconfig.json
└── .env.example                # Environment template
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (for native fetch and ESM support)
- **PostgreSQL** 15+ (or use Docker)
- **npm** 10+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Dev4057/Prabandh402.git
cd Prabandh402

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start PostgreSQL
docker compose up -d database

# 5. Push database schema
npm run db:push

# 6. Generate a keypair for the provider
ATTESTATION_PRIV=$(openssl rand -hex 32)
echo "Private key: 0x$ATTESTATION_PRIV"
ATTESTATION_PRIV=$ATTESTATION_PRIV node scripts/derive-pubkey.mjs
# Copy the public key to sid.json and .env
```

### Running the Demo

```bash
# Terminal 1: Start Registry (EIP-8004 Identity Layer)
npm run dev:registry

# Terminal 2: Start Provider (x402 Payment Endpoint)
npm run dev:provider:run

# Terminal 3: Run the Agent Demo
npm run agent:demo
```

### Expected Output

```
1) Fetch SID from registry                          ◀── EIP-8004 Discovery
   service_id: acme-freight

2) Call provider /booking to get 402 payload        ◀── x402 Payment Request
   402 payload: { booking_id: "bk_...", amount: "12.50", ... }

3) Verify 402 signature with SID public key         ◀── Trust Verification
   402 signature valid ✓

4) Mock payment (Phase 1) and call callback         ◀── x402 Payment Execution
   receipt payload: { receipt: {...}, signature: "0x..." }

5) Verify receipt signature                         ◀── Proof of Service
   Receipt signature valid ✓

Demo complete: booking confirmed.
```

---

## 🔧 Configuration

### Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════
# REGISTRY SERVICE (EIP-8004 Identity Layer)
# ═══════════════════════════════════════════════════════════════
REGISTRY_PORT=4000
REGISTRY_DB_URL=postgres://postgres:postgres@localhost:5432/registry

# ═══════════════════════════════════════════════════════════════
# PROVIDER SERVICE (x402 Payment Endpoint)
# ═══════════════════════════════════════════════════════════════
PROVIDER_PORT=4001
PROVIDER_HOST=localhost:4001

# Payment configuration (where payments are received)
PROVIDER_PAYMENT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f...
PROVIDER_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  # USDC on Base
PROVIDER_NETWORK=base

# Attestation key (signs SIDs and 402 payloads)
# ⚠️  NEVER COMMIT THIS - Generate with: openssl rand -hex 32
PROVIDER_ATTESTATION_PRIVATE_KEY=0x...

# ═══════════════════════════════════════════════════════════════
# AGENT CLIENT
# ═══════════════════════════════════════════════════════════════
AGENT_REGISTRY_URL=http://localhost:4000
AGENT_PROVIDER_URL=http://localhost:4001

# ═══════════════════════════════════════════════════════════════
# x402 FACILITATOR (Payment verification & escrow)
# ═══════════════════════════════════════════════════════════════
FACILITATOR_URL=http://localhost:4002
```

---

## 📡 API Reference

### Registry Service — EIP-8004 Identity Layer

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sid` | POST | Register a new Service Identity Document |
| `/sid/:service_id` | GET | Fetch a specific SID |
| `/search` | GET | Query all registered SIDs |
| `/health` | GET | Health check |

### Provider Service — x402 Payment Endpoint

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/booking` | POST | Request a booking → Returns HTTP 402 |
| `/payment/confirm` | POST | Confirm payment with tx_hash → Returns receipt |
| `/health` | GET | Health check |

---

## 🔐 Security Model

### Protocol Separation

| Layer | Protocol | Security Property |
|-------|----------|-------------------|
| **Identity** | EIP-8004 | Cryptographic proof of service ownership |
| **DNS Binding** | EIP-8004 | Domain proves control of attestation key |
| **Payment Request** | x402 | Signed by provider's attestation key |
| **Payment Execution** | x402 | On-chain settlement, immutable |
| **Receipt** | x402 | Signed proof of service delivery |

### Trust Flow

```
1. Provider creates SID (EIP-8004)
   └── Signs with attestation private key
   └── Publishes public key in DNS TXT record

2. Agent discovers provider (EIP-8004)
   └── Fetches SID from registry
   └── Has provider's verified public key

3. Provider sends 402 (x402)
   └── Signs payment request with same attestation key

4. Agent verifies (EIP-8004 + x402)
   └── Signature matches SID public key ✓
   └── Payment address matches SID ✓
   └── Safe to pay!

5. Payment executes (x402)
   └── On-chain transaction = immutable proof

6. Receipt issued (x402)
   └── Signed by provider = cryptographic proof
```

---

## 🗺 Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] EIP-8004 SID schema and signing
- [x] Registry with PostgreSQL storage
- [x] Provider stub with HTTP 402 responses
- [x] Agent demo with signature verification
- [x] Mock payment flow

### Phase 2: Production
- [ ] Real DNS TXT verification (DNSSEC)
- [ ] On-chain payment verification (Base, USDC)
- [ ] x402 Facilitator service (escrow)
- [ ] SID on-chain anchoring
- [ ] Rate limiting and security hardening

### Phase 3: Scale
- [ ] Multi-chain support (Ethereum, Polygon, Base, Arbitrum)
- [ ] SID revocation and rotation
- [ ] Reputation system based on tx history
- [ ] Agent SDKs (TypeScript, Python)

### Phase 4: Ecosystem
- [ ] EIP-8004 formal specification
- [ ] Integration with AI frameworks (LangChain, AutoGPT)
- [ ] Logistics provider partnerships
- [ ] Enterprise deployment guides

---

## 📚 References

- **EIP-8004**: Service Identity Document standard for cryptographic service identity
- **x402**: HTTP-native payment protocol using status code 402
- **secp256k1**: Elliptic curve used for signatures (same as Ethereum)

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  <strong>Built for the machine economy.</strong><br>
  <sub>Prabandh402 — Where AI agents autonomously transact in the real world.</sub>
</p>
