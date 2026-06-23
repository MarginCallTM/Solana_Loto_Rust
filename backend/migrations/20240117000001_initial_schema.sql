-- Enable UUID extension (gen_random_uuid is also available natively, but we keep uuid-ossp for clarity)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- USERS — pure OFF-CHAIN enrichment (wallet -> username).
-- The chain has no notion of "user": it only knows pubkeys.
-- This table NEVER holds critical logic; it only decorates pubkeys.
-- =====================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL, -- Solana pubkey (base58, <= 44 chars)
    username VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- =====================================================================
-- LOTTERIES — mirror of the on-chain `Lottery` PDA (cache).
-- Natural key = round_id (the value present in EVERY on-chain event).
-- =====================================================================
CREATE TABLE lotteries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- On-chain identity (the indexer upserts ON CONFLICT (round_id)).
    round_id BIGINT NOT NULL UNIQUE,            -- u64 logical key, derived from seeds ["lottery", round_id]
    lottery_account VARCHAR(44) NOT NULL UNIQUE, -- the Lottery PDA address (base58)

    -- Authority allowed to draw_winner (on-chain pubkey, source of truth).
    authority VARCHAR(44) NOT NULL,

    -- Configuration (lamports; 1 SOL = 1e9 lamports).
    ticket_price BIGINT NOT NULL,               -- u64
    end_time TIMESTAMPTZ NOT NULL,              -- indexer converts end_timestamp (unix i64) -> tz

    -- Mutable state mirrored from chain.
    total_tickets BIGINT NOT NULL DEFAULT 0,    -- u64 (was INTEGER: overflow-unsafe)
    pot_amount BIGINT NOT NULL DEFAULT 0,       -- u64 (renamed from prize_pool to match on-chain)
    state VARCHAR(10) NOT NULL DEFAULT 'Open',  -- mirrors LotteryState enum
    claimed BOOLEAN NOT NULL DEFAULT FALSE,     -- prize paid out?

    -- Winner (filled when WinnerDrawn / PrizeClaimed are indexed).
    winner_index BIGINT,                        -- Option<u64> -> NULL until drawn
    winner_address VARCHAR(44),                 -- resolved pubkey of the winning ticket buyer
    winner_id UUID REFERENCES users(id),        -- optional enrichment (NOT a source of truth)

    -- Bookkeeping.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- row insertion time (NOT on-chain time)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints = ON-CHAIN invariants only (safe to mirror; the program enforces them).
    -- NOTE: we deliberately DROP the old `end_time > created_at` check:
    --       it tied on-chain time to wall-clock and broke history replay.
    CHECK (ticket_price > 0),
    CHECK (total_tickets >= 0),
    CHECK (pot_amount >= 0),
    CHECK (state IN ('Open', 'Drawing', 'Closed'))
);

CREATE INDEX idx_lotteries_state ON lotteries(state);
CREATE INDEX idx_lotteries_end_time ON lotteries(end_time);
CREATE INDEX idx_lotteries_authority ON lotteries(authority);

-- =====================================================================
-- TICKETS — mirror of each on-chain `Ticket` PDA.
-- On-chain identity = (round_id, index). We key on (lottery_id, ticket_index).
-- =====================================================================
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,

    -- On-chain ticket data.
    ticket_index BIGINT NOT NULL,               -- u64 `index` field (was ticket_number INTEGER)
    buyer_address VARCHAR(44) NOT NULL,         -- buyer pubkey = SOURCE OF TRUTH
    user_id UUID REFERENCES users(id),          -- optional enrichment (nullable on purpose)

    -- Blockchain proof.
    transaction_signature VARCHAR(88) NOT NULL, -- base58 signature (<= 88 chars)

    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Idempotency anchor for the indexer: a ticket index is unique within a round.
    UNIQUE (lottery_id, ticket_index),
    CHECK (ticket_index >= 0)
);

CREATE INDEX idx_tickets_lottery ON tickets(lottery_id);
CREATE INDEX idx_tickets_buyer ON tickets(buyer_address);
CREATE INDEX idx_tickets_signature ON tickets(transaction_signature);

-- =====================================================================
-- TRANSACTIONS — audit trail of indexed instructions.
-- signature UNIQUE = the idempotency anchor (replaying an event is a no-op).
-- =====================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    signature VARCHAR(88) UNIQUE NOT NULL,

    lottery_id UUID REFERENCES lotteries(id),
    user_id UUID REFERENCES users(id),

    tx_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,

    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- tx_type values = the ACTUAL on-chain instruction names.
    CHECK (tx_type IN ('initialize_lottery', 'buy_ticket', 'draw_winner', 'payout')),
    CHECK (status IN ('pending', 'confirmed', 'failed'))
);

CREATE INDEX idx_transactions_lottery ON transactions(lottery_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_processed_at ON transactions(processed_at);

-- =====================================================================
-- updated_at auto-touch trigger (mutable tables only).
-- =====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lotteries_updated_at BEFORE UPDATE ON lotteries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

