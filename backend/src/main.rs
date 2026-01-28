 // mod config; Added this after
mod db;
mod models;

use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    tracing::info!("🚀 Starting Lottery API...");

    // Load environment variables
    dotenv::dotenv().ok();

    // Get database URL from environment
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    // Create database pool
    let db_pool = db::create_pool(&database_url, 5).await?;

    // Test database connection
    sqlx::query("SELECT 1")
        .execute(&db_pool)
        .await?;
    tracing::info!("✅ Database connection verified");

    // Build router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check));

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("✅ Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "Solana Lottery API v0.1.0"
}

async fn health_check() -> &'static str {
    "OK"
}