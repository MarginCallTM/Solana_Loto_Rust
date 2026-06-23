use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// Mirror of one row of the 'indexer_state' table: the resume cursor.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct IndexerState {
    pub id: String,
    pub last_signature: Option<String>,
    pub last_slot: Option<i64>,
    pub updated_at: DateTime<Utc>,
}

