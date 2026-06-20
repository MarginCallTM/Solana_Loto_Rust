use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Lottery {
    pub id: Uuid,
    pub round_id: i64,
    pub lottery_account: String,
    pub authority: String,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
    pub total_tickets: i64,
    pub pot_amount: i64,
    pub state: String,
    pub claimed: bool,
    pub winner_index: Option<i64>,
    pub winner_address: Option<String>,
    pub winner_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLottery {
    // What the INDEXER extracts from a LotteryInitialized event.
    pub round_id: i64,
    pub lottery_account: String,
    pub authority: String,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct LotteryStats {
    pub id: Uuid,
    pub round_id: i64,
    pub ticket_price: i64,
    pub end_time: DateTime<Utc>,
    pub total_tickets: i64,
    pub pot_amount: i64,
    pub state: String,
    pub time_remaining_seconds: Option<i64>,
}

impl Lottery {
   pub fn to_stats(&self) -> LotteryStats {
        let now = Utc::now();
        // "Open" + not yet expired => a remaining time make sense.
        let time_remaining = if self.state == "Open" && self.end_time > now {
            Some((self.end_time - now).num_seconds())
        } else {
            None
        };

        LotteryStats {
            id: self.id,
            round_id: self.round_id,
            ticket_price: self.ticket_price,
            end_time: self.end_time,
            total_tickets: self.total_tickets,
            pot_amount: self.pot_amount,
            state: self.state.clone(),
            time_remaining_seconds: time_remaining,
        }
   }
}