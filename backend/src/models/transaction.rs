use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "snake_case")]
pub enum TransactionType {
    BuyTicket,
    DrawWinner,
    ClaimPrize,
    CreateLottery,
}

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "snake_case")]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
}

#[derive(Debug, Clone, Deserialize, Serialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub signature: String,
    pub lottery_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub tx_type: String,
    pub status: String,
    pub processed_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTransaction {
    pub signature: String,
    pub lottery_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub tx_type: TransactionType,
}
