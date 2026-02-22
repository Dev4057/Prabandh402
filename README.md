# Prabandh402

> **Agent-Native Logistics Transaction Layer**  
Enabling AI systems to autonomously discover, verify, and book real-world logistics services using cryptographic service identity (EIP-8004) and instant HTTP-native payments (x402).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.7-green.svg)](https://www.fastify.io/)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [Introduction](#introduction)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Overview](#api-overview)
- [Technical Details](#technical-details)
- [Roadmap](#roadmap)

---

## Introduction

**Prabandh402** is a prototype system for agent-native, autonomous logistics.  
It enables AI agents to:
- Discover logistics providers
- Verify provider identity (using cryptography and DNS binding, EIP-8004)
- Execute instant payments (x402—HTTP-native, blockchain-settled)
- Book services without human involvement

### Key Protocols
- **EIP-8004**: Service Identity Document (SID), cryptographically bind identity, API, and payment address
- **x402**: Machine-to-machine HTTP-native payment protocol

---

## Project Structure

```
Prabandh402/
├── agent-cli/
│   └── src/
│       ├── index.ts         # Minimal agent server (demo harness)
│       └── demo.ts          # End-to-end agent flow (discovery, verification, payment)
├── provider-stub/
│   └── src/
│       ├── server.ts        # Fastify server for provider simulation
│       ├── crypto.ts        # secp256k1 signing/verification
│       └── routes/
│           ├── booking.ts   # Provides /booking endpoint (HTTP 402)
│           └── callback.ts  # For /payment/confirm (receipts)
├── registry/
│   └── src/
│       ├── server.ts        # Fastify registry server
│       ├── sid.ts           # SID schema/signature utilities
│       ├── db/
│       │   └── schema.ts    # Drizzle ORM schema (PostgreSQL)
│       ├── routes/
│       │   └── sidRoutes.ts # /sid and /search endpoints
│       └── trust/
│           └── dnsCheck.ts  # Simulated DNS validation
│       └── utils/
│           └── stableStringify.ts # Deterministic JSON for signing
├── scripts/
│   ├── sign-sid.mjs         # SID signing utility
│   └── derive-pubkey.mjs    # Public key derivation utility
├── sid.json                 # Example SID
├── Dockerfile               # Docker build instructions
├── docker-compose.yml       # Compose for DB, registry, provider
├── drizzle.config.ts        # Drizzle ORM config
├── tsconfig.json            # TypeScript config
├── package.json             # NPM scripts/config, dependencies
├── .env.example             # Sample environment file
├── LICENSE
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm 10+

### Setup

```bash
git clone https://github.com/Dev4057/Prabandh402.git
cd Prabandh402

npm install

cp .env.example .env
# Edit .env for local DB and keys

docker compose up -d database
npm run db:migrate

# Generate a provider key
ATTESTATION_PRIV=$(openssl rand -hex 32)
echo "Private key: 0x$ATTESTATION_PRIV"
ATTESTATION_PRIV=$ATTESTATION_PRIV node scripts/derive-pubkey.mjs
# Copy public key to sid.json and .env

# Run services
npm run dev:registry        # Registry service (port 4000)
npm run dev:provider:run    # Provider simulation (port 4001)
npm run agent:demo          # Agent demo (end-to-end flow)
```

---

## Configuration

Edit `.env` to set up service ports, DB url, provider keys, agent/registry/provider URLs, and callback endpoints.  
Refer to `.env.example` for all necessary variables.

---

## API Overview

### Registry Service (EIP-8004 Identity Layer)

| Endpoint           | Method | Description                            |
|--------------------|--------|----------------------------------------|
| `/sid`             | POST   | Register a new Service Identity Document |
| `/sid/:service_id` | GET    | Fetch a specific SID                   |
| `/search`          | GET    | Query all registered SIDs              |
| `/health`          | GET    | Health check                           |

### Provider Service (x402 Payment Endpoint)

| Endpoint            | Method | Description                                      |
|---------------------|--------|--------------------------------------------------|
| `/booking`          | POST   | Request a booking → Returns HTTP 402 (payment required) |
| `/payment/confirm`  | POST   | Confirm payment (tx_hash) → Returns receipt      |
| `/health`           | GET    | Health check                                     |

---

## Technical Details

- **Cryptographic Identity**: Providers sign their SID using secp256k1. Public key is published for verifiable trust.
- **DNS Binding**: (Phase 1: simulated; Phase 2: real DNS/DNSSEC planned)
- **Instant Payments**: Agents receive HTTP 402 signed payment requests, verify signatures, execute payment (mocked in Phase 1, blockchain-enabled in Phase 2).
- **Receipt Flow**: Provider verifies payment (mocked), issues signed receipt.
- **Database**: Registry stores SIDs, trust flags, signatures.

---

## Roadmap

- [x] EIP-8004 SID schema and signing
- [x] Registry DB and identity flow
- [x] Provider demo with HTTP 402 payments
- [x] Agent demo with signature verification
- [ ] Real DNS verification (DNSSEC)
- [ ] On-chain payment verification (Testnet/USDC)
- [ ] SID anchoring (on-chain)
- [ ] Rate limiting & security hardening
- [ ] Agent SDKs and reputation system

---

## License

This project is licensed under the MIT License.  
See [LICENSE](./LICENSE) for more details.

---

## Contributions

PRs, issues, and suggestions welcome!  
For advanced use, please see the source and the [Prabandh402.docx](./Prabandh402.docx) for background.

---

## Links

- [Original README](https://github.com/Dev4057/Prabandh402/blob/main/README.md)
- [Current Project Structure](https://github.com/Dev4057/Prabandh402/tree/main/)