// The indexer binary: a long-running process that mirrors the on-chain
// program's events into the Postgres cache.
//
// 9.2 = SKELETON only: load config, open the DB pool, connect to devnet RPC,
// read the resume cursor, log where it would resume, then exit cleanly,
// Event fetching/decoding/dispatch come in 9.3+.

use std::str::FromStr;

use lottery_api::db::{self, repositories::IndexerStateRepository};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use lottery_api::indexer::events::decode_program_events;
use lottery_api::indexer::dispatch::dispatch_event;
use solana_client::rpc_client::GetConfirmedSignaturesForAddress2Config;
use solana_client::rpc_config::RpcTransactionConfig;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::signature::Signature;
use solana_transaction_status_client_types::UiTransactionEncoding;

// Logical name of this indexer's cursor row in 'indexer-state'.
const CURSOR_ID: &str = "lottery-devnet";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_target(false).compact().init();
    dotenv::dotenv().ok();

    tracing::info!("Starting lottery indexer...");

    // -- Configuration (from the environment / .env) ---
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let rpc_url = std::env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());
    let program_id_str = std::env::var("PROGRAM_ID").expect("PROGRAM_ID must be set");
    let program_id = Pubkey::from_str(&program_id_str)?;

    // --- Postgres pool (shared code with the API, via the library crate) ---
    let pool = db::create_pool(&database_url, 5).await?;

    // --- Devnet RPC connection (async client) ---
    let rpc = RpcClient::new(rpc_url.clone());
    let version = rpc.get_version().await?;
    let slot = rpc.get_slot().await?;
    tracing::info!(
        "✅ Connected to {rpc_url} (solana-core {}, current slot {slot})",
        version.solana_core
    );
    tracing::info!("Watching program {program_id}");

    // --- Resume cursor: where did we stop last time? ---
    let cursor_repo = IndexerStateRepository::new(pool.clone());
    match cursor_repo.get(CURSOR_ID).await? {
        Some(state) => tracing::info!(
            "Resuming after signature {:?} (slot {:?})",
            state.last_signature,
            state.last_slot,
        ),
        None => tracing::info!(
            "No cursor yet - would start from the beginning of program history"
        ),
    }

    // 9.5: poll forever. Each cycle indexes everything new since the cursor,
    //      then sleeps. A failed cycle is logged and retried on the next tick
    //      (the cursor only advances after a batch is fully processed) ---
    let poll_secs: u64 = std::env::var("POLL_INTERVAL_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(10);
    tracing::info!("Polling every {poll_secs}s (Ctrl+C to stop)");

    loop {
        match run_cycle(&rpc, &pool, &program_id, &program_id_str, &cursor_repo).await {
            Ok(0) => tracing::debug!("No new events"),
            Ok(n) => tracing::info!("Indexed {n} event(s)"),
            Err(e) => tracing::error!("Cycle failed (will retry next tick): {e:#}"),
        }
        tokio::time::sleep(std::time::Duration::from_secs(poll_secs)).await;
    }
}

// One indexing cycle: fetch every signature newer than the saved cursor
// (paging backwards with `before`), dispatch each event oldest -> newest,
// then advance the cursor. Returns how many events were dispatched.
async fn run_cycle(
    rpc: &RpcClient,
    pool: &sqlx::PgPool,
    program_id: &Pubkey,
    program_id_str: &str,
    cursor_repo: &IndexerStateRepository,
) -> anyhow::Result<usize> {  
    // 1. Where did we stop? None on the first run => full backfill.
    let until = cursor_repo.get(CURSOR_ID).await?.and_then(|s| s.last_signature);
    let until_sig = match &until {
        Some(s) => Some(Signature::from_str(s)?),
        None => None,
    };

    // 2. Collect ALL new signatures since the cursor (newest -> oldest),
    //    paging backwards 1000 at a time with `before`.
    let mut new_sigs = Vec::new();
    let mut before: Option<Signature> = None;
    loop {
        let config = GetConfirmedSignaturesForAddress2Config {
            before,
            until: until_sig,
            limit: Some(1000),
            commitment: Some(CommitmentConfig::confirmed()),
        };
        let page = rpc
            .get_signatures_for_address_with_config(program_id, config)
            .await?;
        let Some(oldest) = page.last() else { break };
        before = Some(Signature::from_str(&oldest.signature)?);
        let full_page = page.len() == 1000;
        new_sigs.extend(page);
        if !full_page {
            break;
        }
    }

    if new_sigs.is_empty() {
        return Ok(0);
    }

    // 3. The new cursor is the newest signature of this batch (first element).
    let new_cursor_sig = new_sigs[0].signature.clone();
    let new_cursor_slot = new_sigs[0].slot as i64;

    // 4. Process oldest -> newest so FK order holds, dispatching each event.
    let tx_config = RpcTransactionConfig {
        encoding: Some(UiTransactionEncoding::Json),
        commitment: Some(CommitmentConfig::confirmed()),
        max_supported_transaction_version: Some(0),
    };
    let mut processed = 0usize;
    for status in new_sigs.iter().rev() {
        if status.err.is_some() {
            continue;
        }
        let signature = Signature::from_str(&status.signature)?;
        let tx = rpc.get_transaction_with_config(&signature, tx_config).await?;
        let logs: Option<Vec<String>> = tx
            .transaction
            .meta
            .and_then(|meta| Option::from(meta.log_messages));
        let Some(logs) = logs else { continue };
        for event in decode_program_events(&logs, program_id_str) {
            dispatch_event(pool, program_id, &status.signature, &event).await?;
            processed += 1;
        }
    }

    // 5. Advance the cursor ONLY after the batch is durably processed.
    cursor_repo
        .save_cursor(CURSOR_ID, &new_cursor_sig, new_cursor_slot)
        .await?;

    Ok(processed)
}