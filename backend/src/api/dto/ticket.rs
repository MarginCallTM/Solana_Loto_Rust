use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize)]
pub struct BuyTicketRequest {
    pub lottery_id: Uuid,
    pub wallet_address: String,
    pub transaction_signature: String,
}

#[derive(Debug, Serialize)]
pub struct TicketResponse {
    pub id: Uuid,
    pub lottery_id: Uuid,
    pub ticket_number: i32,
    pub transaction_signature: String,
    pub purchased_at: DateTime<Utc>,
}

impl From<crate::models::Ticket> for TicketResponse {
    fn from(ticket: crate::models::Ticket) -> Self {
           Self {
                id: ticket.id,
                lottery_id: ticket.lottery_id,
                ticket_number: ticket.ticket_number,
                transaction_signature: ticket.transaction_signature,
                purchased_at: ticket.purchased_at,
           } 
    }
}

#[derive(Debug, Serialize)]
pub struct UserTicketResponse {
    // Ticket info
    pub ticket_id: Uuid,
    pub ticket_number: i32,
    pub transaction_signature: String,
    pub purchased_at: DateTime<Utc>,

    // Lottery info (Joined from Database)
    pub lottery_id: Uuid,
    pub lottery_end_time: DateTime<Utc>,
    pub lottery_is_finalized: bool,
    pub ticket_price_sol: f64,
}

// COnvert joined query result to response
impl From<crate::models::TicketWithLottery> for UserTicketResponse {
    fn from(ticket: crate::models::TicketWithLottery) -> Self {
        Self {
            ticket_id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            transaction_signature: ticket.transaction_signature,
            purchased_at: ticket.purchased_at,
            lottery_id: ticket.lottery_id,
            lottery_end_time: ticket.lottery_end_time,
            lottery_is_finalized: ticket.is_finalized,
            ticket_price_sol: ticket.ticket_price as f64 / 1_000_000_000.0,
        }
    }
}

