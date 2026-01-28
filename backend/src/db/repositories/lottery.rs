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


    pub async fn create(&self, create_lottery: CreateLottery, created_by: Uuid) -> anyhow::Result<Lottery> {
        let lottery = sqlx::query_as::<_,Lottery>(
            r#"
            INSERT INTO lotteries (program_account, ticket_price, end_time, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(&create_lottery.program_account)
        .bind(create_lottery.ticket_price)
        .bind(create_lottery.end_time)
        .bind(created_by)
        .fetch_one(&self.pool)
        .await?;

        tracing::info!("Created lottery: {} (price: {} lamports)", lottery.id, lottery.ticket_price);

        Ok(lottery)
    }

    pub async fn find_by_id(&self, id: Uuid) -> anyhow::Result<Option<Lottery>> {
        let lottery = sqlx::query_as::<_,Lottery> (
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
            WHERE is_finalized = FALSE AND end_time > NOW()
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
            UPDATE Lotteries
            SET total_tickets = total_tickets + 1,
                prize_pool = prize_pool + $2
            WHERE id = $1
            "#,
        )
        .bind(lottery_id)
        .bind(ticket_price)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn finalize(&self, lottery_id: Uuid, winning_ticket: i32, winner_id: Uuid) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE lotteries
            SET is_finalized = TRUE,
                winning_ticket_number = $2,
                winner_id = $3
            WHERE id = $1
            "#,
        )

        .bind(lottery_id)
        .bind(winning_ticket)
        .bind(winner_id)
        .execute(&self.pool)
        .await?;

        tracing::info!("Finalized lottery {} - Winner: ticket #{}", lottery_id, winning_ticket);

        Ok(())
    }
}



