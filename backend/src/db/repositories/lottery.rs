use crate::models::{CreateLottery, Lottery};
use sqlx::PgPool;
use uuid::Uuid;

pub struct LotteryRepository {
    pool: PgPool,
}

impl LotteryRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, create_lottery: CreateLottery) -> anyhow::Result<Lottery> {
        let lottery = sqlx::query_as::<_, Lottery>(
            r#"
            INSERT INTO lotteries (round_id, lottery_account, authority, ticket_price, end_time)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(create_lottery.round_id)
        .bind(&create_lottery.lottery_account)
        .bind(&create_lottery.authority)
        .bind(create_lottery.ticket_price)
        .bind(create_lottery.end_time)
        .fetch_one(&self.pool)
        .await?;

        tracing::info!(
            "Created lottery {} (round {}, price: {} lamports)",
            lottery.id,
            lottery.round_id,
            lottery.ticket_price
        );

        Ok(lottery)
    }

    pub async fn find_by_id(&self, id: Uuid) -> anyhow::Result<Option<Lottery>> {
        let lottery = sqlx::query_as::<_, Lottery>(
            r#"
            SELECT * FROM lotteries WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(lottery)
    }

    pub async fn list_active(&self) -> anyhow::Result<Vec<Lottery>> {
        let lotteries = sqlx::query_as::<_, Lottery>(
            r#"
            SELECT * FROM lotteries
            WHERE state = 'Open' AND end_time > NOW()
            ORDER BY end_time ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(lotteries)
    }

    pub async fn increment_ticket_count(&self, lottery_id: Uuid, ticket_price: i64) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE lotteries
            SET total_tickets = total_tickets + 1,
                pot_amount = pot_amount + $2
            WHERE id = $1
            "#,
        )
        .bind(lottery_id)
        .bind(ticket_price)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn finalize(&self, lottery_id: Uuid, winner_index: i64, winner_id: Uuid) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE lotteries
            SET state = 'Closed',
                winner_index = $2,
                winner_id = $3
            WHERE id = $1
            "#,
        )
        .bind(lottery_id)
        .bind(winner_index)
        .bind(winner_id)
        .execute(&self.pool)
        .await?;

        tracing::info!("Finalized lottery {} - winner index #{}", lottery_id, winner_index);

        Ok(())
    }

    /// Idempotent upsert from a LotteryInitialized event. Init fields never
    /// change, so a conflict on the natural key (round_id) is a safe no-op.
    pub async fn upsert_initialized(
        &self,
        round_id: i64,
        lottery_account: &str,
        authority: &str,
        ticket_price: i64,
        end_time: chrono::DateTime<chrono::Utc>,
    ) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            INSERT INTO lotteries (round_id, lottery_account, authority, ticket_price, end_time)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (round_id) DO NOTHING
            "#,
        )
        .bind(round_id)
        .bind(lottery_account)
        .bind(authority)
        .bind(ticket_price)
        .bind(end_time)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// Mirror the on-chain counters: total_tickets = number of indexed tickets,
    /// pot_amount = total_tickets * ticket_price. Recomputed from the rows (never
    /// incremented), so replaying a TicketBought stays correct (idempotent).
    pub async fn sync_counters(&self, round_id: i64) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE lotteries
            SET total_tickets = (SELECT COUNT(*) FROM tickets WHERE tickets.lottery_id = lotteries.id),
                pot_amount    = (SELECT COUNT(*) FROM tickets WHERE tickets.lottery_id = lotteries.id) * ticket_price
            WHERE round_id = $1
            "#,
        )
        .bind(round_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// Mirror a WinnerDrawn event: close the round and record the winning index
    /// (NULL when no ticket was sold). Idempotent: re-applying sets the same value.
    pub async fn set_winner(&self, round_id: i64, winner_index: Option<i64>) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE lotteries
            SET state = 'Closed',
                winner_index = $2
            WHERE round_id = $1
            "#,
        )
        .bind(round_id)
        .bind(winner_index)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// Mirror a PrizeClaimed event: mark the prize paid, record the winner pubkey
    /// and the authoritative final pot (amount carried by the event). Idempotent.
    pub async fn set_claimed(
        &self,
        round_id: i64,
        winner_address: &str,
        pot_amount: i64,
    ) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE lotteries
            SET claimed = true,
                winner_address = $2,
                pot_amount = $3
            WHERE round_id = $1
            "#,
        )
        .bind(round_id)
        .bind(winner_address)
        .bind(pot_amount)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
