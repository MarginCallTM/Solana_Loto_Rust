use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Ticket {
    pub id: Uuid,
    pub lottery_id: Uuid,
    pub user_id: Uuid,
    pub ticket_number: i32,
    pub transaction_signature: String,
    pub purchased_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTicket {
    pub lottery_id: Uuid,
    pub user_id: Uuid,
    pub ticket_number: i32,
    pub transaction_signature: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TicketWithLottery {
    // Ticket fields
    pub ticket_id: Uuid,
    pub ticket_number: i32,
    pub transaction_signature: String,
    pub purchased_at: DateTime<Utc>,

    // Lottery fields
    pub lottery_id: Uuid,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
    pub is_finalized: bool,
}