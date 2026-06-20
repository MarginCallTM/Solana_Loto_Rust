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
}
