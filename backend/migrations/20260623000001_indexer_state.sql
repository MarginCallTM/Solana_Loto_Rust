-- =====================================================================
-- INDEXER_STATE — the indexer's resume cursor (NOT critical state).
-- Wiping this table just makes the indexer re-scan from scratch and
-- rebuild the same DB (idempotent upserts). It is a perf optimization,
-- never a source of truth (D9: reconstructible cache).
-- =====================================================================
CREATE TABLE indexer_state (
    -- Logical name of the cursor (e.g. 'lottery-devnet'). One row per indexer.
    id TEXT PRIMARY KEY,

    -- Last FULLY processed tx signature. NULL = the indexer never ran yet.
    -- Used as the 'until' bound of getSignaturesForAddress on resume.
    last_signature VARCHAR(88),

    -- Slot of that signature: not needed to resume, but exposes the indexer
    -- lag (head slot - last_slot) for observability.
    last_slot BIGINT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
