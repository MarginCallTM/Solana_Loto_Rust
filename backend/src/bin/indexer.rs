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

    // --- 9.3 part 2: fetch recent program transactions decode their events.
    //          One page only here; pagination + cursor-driven `until` come in 9.5 ---
    let sig_config = GetConfirmedSignaturesForAddress2Config {
        limit: Some(1000),
        commitment: Some(CommitmentConfig::confirmed()),
        ..Default::default()
    };
    let signatures = rpc
        .get_signatures_for_address_with_config(&program_id, sig_config)
        .await?;
    tracing::info!("Fetched {} signature(s) for the program", signatures.len());

    // RpcTransactionConfig is Copy, so the same value is reused every iteration.
    let tx_config = RpcTransactionConfig {
        encoding: Some(UiTransactionEncoding::Json),
        commitment: Some(CommitmentConfig::confirmed()),
        max_supported_transaction_version: Some(0),
    };

    // Process oldest -> newest so a round's Initialized row exists before its
    // TicketBought / WinnerDrawn / PrizeClaimed rows reference it (FK order).
    for status in signatures.iter().rev() {
        // Skip failed transactions: their on-chain effects were reverted.
        if status.err.is_some() {
            continue;
        }

        let signature = Signature::from_str(&status.signature)?;
        let tx = rpc.get_transaction_with_config(&signature, tx_config).await?;

        // Logs live in the transaction meta; OptionSerializer -> plain Option.
        let logs: Option<Vec<String>> = tx
            .transaction
            .meta
            .and_then(|meta| Option::from(meta.log_messages));
        let Some(logs) = logs else {continue};

        for event in decode_program_events(&logs, &program_id_str) {
            tracing::info!("{} -> {:?}", status.signature, event);
            dispatch_event(&pool, &program_id, &status.signature, &event).await?;
        }
    }

    Ok(())
}
