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
    let cursor_repo = IndexerStateRepository::new(pool);
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

    tracing::info!("Indexer skeleton OK — exiting (event loop comes in 9.3+).");
    Ok(())
}