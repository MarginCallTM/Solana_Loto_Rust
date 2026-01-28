use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Lottery {
    pub id: Uuid,
    pub program_account: String,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
    pub total_tickets: i32,
    pub prize_pool: i64,
    pub winning_ticket_number: Option<i32>,
    pub winner_id: Option<Uuid>,
    pub is_finalized: bool,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLottery {
    pub program_account: String,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct LotteryStats {
    pub id: Uuid,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
    pub total_tickets: i32,
    pub prize_pool: i64,
    pub is_finalized: bool,
    pub time_remaining_seconds: Option<i64>,
}

impl Lottery {
    pub fn to_stats(&self) -> LotteryStats {
        let now = Utc::now();
        let time_remaining = if self.end_time > now && !self.is_finalized {
            Some((self.end_time - now).num_seconds())
        } else {
            None
        };

        LotteryStats {
            id: self.id,
            ticket_price: self.ticket_price,
            end_time: self.end_time,
            total_tickets: self.total_tickets,
            prize_pool: self.prize_pool,
            is_finalized: self.is_finalized,
            time_remaining_seconds: time_remaining,
        }
    }
}