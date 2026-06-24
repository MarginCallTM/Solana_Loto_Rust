// Off-chain dispatch: mirror a decoded LotteryEvent into the Postgres cache.
// Every write is idempotent (the repos use ON CONFLICT / recompute), so the
// same event can be processed more than once without corrupting the cache.
// D9: we RECOPY what the chain decided; we never compute the winner or pot.

use anyhow::Result;
use solana_sdk::pubkey::Pubkey;
use sqlx::PgPool;

use crate::db::repositories::{LotteryRepository, TicketRepository, TransactionRepository};
use crate::indexer::events::LotteryEvent;
use crate::models::TransactionType;

// Raw 32-byte on-chain pubkey -> base58 string (the form stored in the DB).
fn to_base58(raw: &[u8; 32]) -> String {
    Pubkey::new_from_array(*raw).to_string()
}

/// Idempotently mirror one decoded event into the cache.
/// `signature` is the tx that emitted it; `program_id` lets us re-derive the
/// Lottery PDA address (the event doesn't carry it).
pub async fn dispatch_event(
    pool: &PgPool,
    program_id: &Pubkey,
    signature: &str,
    event: &LotteryEvent,
) -> Result<()> {
    let lotteries = LotteryRepository::new(pool.clone());
    let tickets = TicketRepository::new(pool.clone());
    let transactions = TransactionRepository::new(pool.clone());

    match event {
        LotteryEvent::Initialized(e) => {
            // The Lottery PDA address isn't in the event: derive it from round_id.
            let (lottery_pda, _bump) =
                Pubkey::find_program_address(&[b"lottery", &e.round_id.to_le_bytes()], program_id);
            // Convert the on-chain unix timestamp (i64) to a tz-aware datetime.
            let end_time = chrono::DateTime::from_timestamp(e.end_timestamp, 0)
                .ok_or_else(|| anyhow::anyhow!("invalid end_timestamp {}", e.end_timestamp))?;

            lotteries
                .upsert_initialized(
                    e.round_id as i64,
                    &lottery_pda.to_string(),
                    &to_base58(&e.authority),
                    e.ticket_price as i64,
                    end_time,
                )
                .await?;
            transactions
                .upsert(signature, e.round_id as i64, TransactionType::InitializeLottery)
                .await?;
        }
        LotteryEvent::TicketBought(e) => {
            tickets
                .upsert_for_round(e.round_id as i64, e.index as i64, &to_base58(&e.buyer), signature)
                .await?;
            // Refresh the mirrored counters from the actual ticket rows.
            lotteries.sync_counters(e.round_id as i64).await?;
            transactions
                .upsert(signature, e.round_id as i64, TransactionType::BuyTicket)
                .await?;
        }
        LotteryEvent::WinnerDrawn(e) => {
            lotteries
                .set_winner(e.round_id as i64, e.winner_index.map(|i| i as i64))
                .await?;
            transactions
                .upsert(signature, e.round_id as i64, TransactionType::DrawWinner)
                .await?;
        }
        LotteryEvent::PrizeClaimed(e) => {
            lotteries
                .set_claimed(e.round_id as i64, &to_base58(&e.winner), e.amount as i64)
                .await?;
            transactions
                .upsert(signature, e.round_id as i64, TransactionType::Payout)
                .await?;
        }
    }

    Ok(())
}
