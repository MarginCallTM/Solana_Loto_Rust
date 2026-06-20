# Solana Lottery

A decentralized lottery on Solana, built as a learning and portfolio project.
The critical logic lives **on-chain** (Anchor program); everything off-chain is a
**reconstructible cache** fed from on-chain events.

> ⚠️ **Devnet only.** The MVP uses simple on-chain pseudo-randomness, which a
> validator can influence. It is **not secure** and must be replaced by a VRF
> (e.g. Switchboard) before any real use. Do not deploy to mainnet as-is.

## Architecture

```
Frontend (Next.js + wallet) --RPC--> Solana devnet (Anchor program)
        |                                   | emits events
        | reads history                     v
        +-------------------------->  Indexer  -->  PostgreSQL (cache)
```

- **On-chain program** (`programs/lottery`): the source of truth. Instructions
  `initialize_lottery`, `buy_ticket`, `draw_winner`, `payout`.
- **PostgreSQL**: a reconstructible cache mirroring on-chain state. Never holds
  critical logic.
- **Backend** (`backend`, Rust/Axum): read API over the cache (work in progress).
- **Indexer**: subscribes to program events and upserts them into the cache
  (planned).

Program ID (devnet): `DD5CPAQWUtKSBajtNT9w4QbJysQnuWeDZ6yCdXKAYwro`

## Tech stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| On-chain     | Rust + Anchor 0.31.1            |
| Currency     | Native SOL (lamports)           |
| Backend      | Rust + Axum + sqlx              |
| Database     | PostgreSQL 16                   |
| Frontend     | Next.js (planned)               |
| Network      | Solana devnet                   |

## Prerequisites

- Rust toolchain + Solana CLI + Anchor (for the on-chain program)
- Docker (for the local PostgreSQL service)
- `sqlx-cli` (for migrations): `cargo install sqlx-cli --no-default-features --features postgres`

## Getting started

### 1. Database (Docker)

The database runs as a container described in `docker-compose.yml`.

```bash
cp .env.example .env          # local config (gitignored)
docker compose up -d          # start PostgreSQL in the background
docker compose ps             # wait until the service is "healthy"
```

PostgreSQL is exposed on host port **5433** (port 5432 is left free for any
native install). The connection string lives in `.env`:

```
DATABASE_URL=postgres://lottery:lottery@localhost:5433/lottery_db
```

Apply the schema:

```bash
cd backend && sqlx migrate run
```

Stop the database (data persists in the `lottery_pgdata` volume):

```bash
docker compose down
```

### 2. On-chain program

```bash
make build        # anchor build
make test         # anchor test (localnet, runs the full test suite)
```

Deploy to devnet (rebuild with the v0 arch first):

```bash
cargo build-sbf --manifest-path programs/lottery/Cargo.toml --arch v0
solana program deploy target/deploy/lottery.so \
  --program-id target/deploy/lottery-keypair.json \
  --url devnet
```

### 3. Backend tests

Integration tests use `#[sqlx::test]`, which spins up an ephemeral database per
test. Point `DATABASE_URL` at the running PostgreSQL server:

```bash
cd backend && DATABASE_URL="postgres://lottery:lottery@localhost:5433/lottery_db" cargo test
```

## Status

- [x] On-chain program + tests (green on localnet)
- [x] Deployed and executing on devnet
- [x] Database schema mirroring the on-chain model + repositories + tests
- [x] Local PostgreSQL via Docker Compose
- [ ] Indexer (on-chain events → cache)
- [ ] Frontend (Next.js)

## Security

- All critical logic (winner selection, fund movements) is on-chain.
- The `Vault` PDA holds funds, kept separate from the `Lottery` state account.
- On-chain randomness is **insecure** and devnet-only — see the warning above.
