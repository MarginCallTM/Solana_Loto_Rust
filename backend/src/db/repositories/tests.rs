use crate::db::repositories::{IndexerStateRepository, LotteryRepository, TicketRepository, TransactionRepository};
use crate::models::{CreateLottery, CreateTicket, CreateTransaction, TransactionType};
use chrono::{Duration, Utc};
use sqlx::PgPool;

// Build a CreateLottery with sensible defaults for a given round_id.
fn sample_lottery(round_id: i64) -> CreateLottery {
    CreateLottery {
        round_id,
        lottery_account: format!("Lottery{round_id}Pda"),
        authority: "Authority1111111111111111111111111111111111".to_string(),
        ticket_price: 100_000_000, // 0.1 SOL in lamports
        end_time: Utc::now() + Duration::seconds(3600),
    }
}

// 1. Happy path: a lottery inserted then read back keeps its on-chain initial state.
#[sqlx::test]
async fn lottery_round_trip(pool: PgPool) {
    let repo = LotteryRepository::new(pool);

    let created = repo.create(sample_lottery(1)).await.unwrap();
    assert_eq!(created.round_id, 1);
    assert_eq!(created.total_tickets, 0);
    assert_eq!(created.pot_amount, 0);
    assert_eq!(created.state, "Open");
    assert!(!created.claimed);
    assert!(created.winner_index.is_none());

    let found = repo.find_by_id(created.id).await.unwrap().unwrap();
    assert_eq!(found.lottery_account, created.lottery_account);
    assert_eq!(found.authority, created.authority);
}

// 2. A ticket inserts, and the counters mirror the on-chain state.
#[sqlx::test]
async fn ticket_insert_and_increment(pool: PgPool) {
    let lottery_repo = LotteryRepository::new(pool.clone());
    let ticket_repo = TicketRepository::new(pool.clone());

    let lottery = lottery_repo.create(sample_lottery(7)).await.unwrap();

    let ticket = ticket_repo
        .create(CreateTicket {
            lottery_id: lottery.id,
            ticket_index: 0,
            buyer_address: "Buyer111111111111111111111111111111111111".to_string(),
            transaction_signature: "sig_buy_0".to_string(),
        })
        .await
        .unwrap();
    assert_eq!(ticket.ticket_index, 0);
    assert!(ticket.user_id.is_none()); // enrichment not set by the indexer yet

    lottery_repo
        .increment_ticket_count(lottery.id, lottery.ticket_price)
        .await
        .unwrap();

    let updated = lottery_repo.find_by_id(lottery.id).await.unwrap().unwrap();
    assert_eq!(updated.total_tickets, 1);
    assert_eq!(updated.pot_amount, lottery.ticket_price);

    let count = ticket_repo.count_by_lottery(lottery.id).await.unwrap();
    assert_eq!(count, 1);
}

// 3. FAILURE CASE: the same round_id cannot be inserted twice (idempotency anchor).
#[sqlx::test]
async fn duplicate_round_id_is_rejected(pool: PgPool) {
    let repo = LotteryRepository::new(pool);

    repo.create(sample_lottery(42)).await.unwrap();
    let second = repo.create(sample_lottery(42)).await;

    assert!(second.is_err(), "inserting the same round_id twice must fail");
}

// 4. FAILURE CASE: the same (lottery_id, ticket_index) cannot be inserted twice.
#[sqlx::test]
async fn duplicate_ticket_index_is_rejected(pool: PgPool) {
    let lottery_repo = LotteryRepository::new(pool.clone());
    let ticket_repo = TicketRepository::new(pool.clone());

    let lottery = lottery_repo.create(sample_lottery(9)).await.unwrap();

    let make = |sig: &str| CreateTicket {
        lottery_id: lottery.id,
        ticket_index: 0,
        buyer_address: "BuyerX1111111111111111111111111111111111".to_string(),
        transaction_signature: sig.to_string(),
    };

    ticket_repo.create(make("sig_a")).await.unwrap();
    let dup = ticket_repo.create(make("sig_b")).await;

    assert!(dup.is_err(), "same (lottery_id, ticket_index) must be rejected");
}

// 5. The TransactionType enum maps to a value accepted by the tx_type CHECK.
#[sqlx::test]
async fn transaction_insert_matches_check(pool: PgPool) {
    let tx_repo = TransactionRepository::new(pool);

    let tx = tx_repo
        .create(CreateTransaction {
            signature: "sig_init_1".to_string(),
            lottery_id: None,
            user_id: None,
            tx_type: TransactionType::InitializeLottery,
        })
        .await
        .unwrap();

    assert_eq!(tx.tx_type, "initialize_lottery"); // would violate the CHECK if mismapped
    assert_eq!(tx.status, "pending");
}

// 6. The resume cursor round-trips: INSERT path then UPDATE (ON CONFLICT) path.
#[sqlx::test]
async fn indexer_cursor_round_trip(pool: PgPool) {
    let repo = IndexerStateRepository::new(pool);
    let id = "lottery-devnet";

    // Never ran yet -> no cursor stored.
    let initial = repo.get(id).await.unwrap();
    assert!(initial.is_none());

    // First save takes the INSERT branch.
    repo.save_cursor(id, "sig_one", 100).await.unwrap();
    let after_first = repo.get(id).await.unwrap().unwrap();
    assert_eq!(after_first.last_signature.as_deref(), Some("sig_one"));
    assert_eq!(after_first.last_slot, Some(100));

    // Advancing takes the UPDATES (ON CONFLICT) branch: same id, new values.
    repo.save_cursor(id, "sig_two", 250).await.unwrap();
    let after_second = repo.get(id).await.unwrap().unwrap();
    assert_eq!(after_second.last_signature.as_deref(), Some("sig_two"));
    assert_eq!(after_second.last_slot, Some(250));
}
