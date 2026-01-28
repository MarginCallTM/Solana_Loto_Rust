use serde:: {Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize)]
pub struct CreateLotteryRequest {
    pub program_account: String,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct LotteryResponse {
    pub id: Uuid,
    pub program_account: String,

    pub ticket_price: i64,
    pub ticket_price_sol: f64,

    pub end_time: DateTime<Utc>,
    pub total_tickets: i32,

    pub prize_pool: i64,
    pub prize_pool_sol: f64,

    pub is_finalized: bool,
    pub winning_ticket_number: Option<i32>,

    pub time_remaining_seconds: Option<i64>,

    pub created_at: DateTime<Utc>,
}

impl From<crate::models::Lottery> for LotteryResponse {
    fn from(lottery: crate::models::Lottery) -> Self {
        let now = Utc::now();

        let time_remaining = if lottery.end_time > now && !lottery.is_finalized {
            Some((lottery.end_time - now).num_seconds())
        } else {
            None
        }; 

        Self {
            id: lottery.id,
            program_account: lottery.program_account,
            ticket_price: lottery.ticket_price,

            ticket_price_sol: lottery.ticket_price as f64 / 1_000_000_000.0,

            end_time: lottery.end_time,
            total_tickets: lottery.total_tickets, 

            prize_pool: lottery.prize_pool,
            prize_pool_sol: lottery.prize_pool as f64 / 1_000_000_000.0,

            is_finalized: lottery.is_finalized,
            winning_ticket_number: lottery.winning_ticket_number,

            time_remaining_seconds: time_remaining,

            created_at: lottery.created_at,
        }
    }
}