-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL, -- Solana wallet (base58)
    username VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEX FOR FAST WALLET LOOKUPS
CREATE INDEX idx_users_wallet ON users(wallet_address);


-- LOTTERY TABLE

CREATE TABLE lotteries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- SOLANA BLOCKCHAIN REFERENCE
    program_account VARCHAR(44) NOT NULL, -- On-Chain Lottery account

    -- Lottery configuration
    ticket_price BIGINT NOT NULL, -- Price in lamports (1 SOL = 1 000 000 000 lamports)
    end_time TIMESTAMPTZ NOT NULL, -- When lottery closes

    -- Current state
    total_tickets INTEGER NOT NULL DEFAULT 0,
    prize_pool BIGINT NOT NULL DEFAULT 0, -- Total SOL collected

    -- Winner information
    winning_ticket_number INTEGER,
    winner_id UUID REFERENCES users(id),

    -- Status
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadate
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CHECK (ticket_price > 0),
    CHECK (total_tickets >= 0),
    CHECK (prize_pool >= 0),
    CHECK (end_time > created_at)
);


-- INDEXES FOR COMMON QUERIES
CREATE INDEX idx_lotteries_end_time ON lotteries(end_time);
CREATE INDEX idx_lotteries_is_finalized ON lotteries(is_finalized);
CREATE INDEX idx_lotteries_created_by ON lotteries(created_by);


-- TICKETS TABLE

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    -- Ticket information
    ticket_number INTEGER NOT NULL,

    -- Blockchain proof
    transaction_signature VARCHAR(88) NOT NULL, -- Solana transaction signature

    -- Metadata
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(lottery_id, ticket_number), -- Each lottery has unique ticket numbers
    CHECK (ticket_number >= 0)
);

-- INDEXES FOR FAST LOOKUPS
CREATE INDEX idx_tickets_lottery ON tickets(lottery_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_transaction ON tickets(transaction_signature);


-- TRANSACTION TABLE (Audit Trail)

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Blockchain reference
    signature VARCHAR(88) UNIQUE NOT NULL,

    -- Related entities
    lottery_id UUID REFERENCES lotteries(id),
    user_id UUID REFERENCES users(id),

    -- Transaction type
    tx_type VARCHAR(20) NOT NULL, -- 'buy_ticket', 'draw_winner', 'claim_prize', 'create_lottery'

    -- Status Tracking
    status VARCHAR(20) NOT NULL, --'pending', 'confirmed', 'failed'

    -- Metadata
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contraints
    CHECK (tx_type IN ('buy_ticket', 'draw_winner', 'claim_prize', 'create_lottery')),
    CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- INDEXES FOR MONITORING
CREATE INDEX idx_transactions_signature ON transactions(signature);
CREATE INDEX idx_transactions_lottery ON transactions(lottery_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_processed_at ON transactions(processed_at);


-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lotteries_updated_at BEFORE UPDATE ON lotteries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




