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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::indexer::events::{
        LotteryEvent, LotteryInitialized, PrizeClaimed, TicketBought, WinnerDrawn,
    };
    use crate::models::Lottery;

    // A full round as the chain would emit it: init -> 3 buys -> draw -> payout.
    // Each event is paired with the signature of the tx that emitted it.
    fn sample_round() -> Vec<(&'static str, LotteryEvent)> {
        vec![
            (
                "sig_init",
                LotteryEvent::Initialized(LotteryInitialized {
                    round_id: 1,
                    authority: [1u8; 32],
                    ticket_price: 100_000_000,
                    end_timestamp: 1_700_000_000, 
                }),
            ),
            (
                "sig_buy0",
                  LotteryEvent::TicketBought(TicketBought { round_id: 1, buyer: [10u8; 32], index: 0 }),
            ),
            (
                "sig_buy1",
                  LotteryEvent::TicketBought(TicketBought { round_id: 1, buyer: [11u8; 32], index: 1 }),
            ),
            (
                "sig_buy2",
                  LotteryEvent::TicketBought(TicketBought { round_id: 1, buyer: [12u8; 32], index: 2 }),
            ),
            (
                "sig_draw",
                  LotteryEvent::WinnerDrawn(WinnerDrawn { round_id: 1, winner_index: Some(1) }),
            ),
            (
                "sig_payout",
                  LotteryEvent::PrizeClaimed(PrizeClaimed {
                      round_id: 1,
                      winner: [11u8; 32],
                      amount: 300_000_000,
                  }),
            ),
        ]
    }

    async fn replay(pool: &PgPool, program_id: &Pubkey) {
        for (sig, event) in sample_round() {
            dispatch_event(pool, program_id, sig, &event).await.unwrap();
        }
    }

    async fn count(pool: &PgPool, table: &str) -> i64 {
        // `table` is always a hardcoded literalv at the call sites (never user input).
        let (n,): (i64,) = sqlx::query_as(&format!("SELECT COUNT(*) FROM {table}"))
            .fetch_one(pool)
            .await
            .unwrap();
        n
    }

    // Replaying a full round from an enmpty DB yields the exact mirrored state,
    // and replaying it again changes nothing: idempotence = D9 reconstructibility.
    #[sqlx::test]
    async fn replay_is_deterministic_and_idempotent(pool: PgPool) {
        let program_id = Pubkey::new_unique();

        // --- First replay, from an empty DB ---
        replay(&pool, &program_id).await;

        let lottery = sqlx::query_as::<_, Lottery>("SELECT * FROM lotteries WHERE
         round_id = $1")
            .bind(1_i64)
            .fetch_one(&pool)
            .await
            .unwrap();

        let expected_winner = Pubkey::new_from_array([11u8; 32]).to_string();
        assert_eq!(lottery.total_tickets, 3);
        assert_eq!(lottery.pot_amount, 300_000_000);
        assert_eq!(lottery.state, "Closed");
        assert_eq!(lottery.winner_index, Some(1));
        assert_eq!(lottery.winner_address.as_deref(),
    Some(expected_winner.as_str()));
        assert!(lottery.claimed);
        assert_eq!(count(&pool, "tickets").await, 3);
        assert_eq!(count(&pool, "transactions").await, 6);

        // --- Second replay of the SAME events: nothing must change ---
        replay(&pool, &program_id).await;

        let after = sqlx::query_as::<_, Lottery>("SELECT * FROM lotteries WHERE
    round_id = $1")
            .bind(1_i64)
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(after.total_tickets, 3, "replay must not double-count tickets");
        assert_eq!(after.pot_amount, 300_000_000);
        assert_eq!(count(&pool, "tickets").await, 3, "replay must not duplicate tickets");
        assert_eq!(count(&pool, "transactions").await, 6, "replay must not duplicate transactions");
    }
}