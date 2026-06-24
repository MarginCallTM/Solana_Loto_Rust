use crate::models::{CreateTicket, Ticket, TicketWithLottery};
use sqlx::PgPool;
use uuid::Uuid;

pub struct TicketRepository {
    pool: PgPool,
}

impl TicketRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, create_ticket: CreateTicket) -> anyhow::Result<Ticket> {
        let ticket = sqlx::query_as::<_, Ticket> (
            r#"
            INSERT INTO tickets (lottery_id, ticket_index, buyer_address, transaction_signature)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(create_ticket.lottery_id)
        .bind(create_ticket.ticket_index)
        .bind(create_ticket.buyer_address)
        .bind(&create_ticket.transaction_signature)
        .fetch_one(&self.pool)
        .await?;

        tracing::info!(
            "Created ticket #{} for lottery {} (buyer: {})",
            ticket.ticket_index,
            ticket.lottery_id,
            ticket.buyer_address
        );

        Ok(ticket)
    }

    pub async fn find_by_lottery(&self, lottery_id: Uuid) -> anyhow::Result<Vec<Ticket>> {
        let tickets = sqlx::query_as::<_, Ticket> (
            r#"
            SELECT * FROM tickets
            WHERE lottery_id = $1
            ORDER BY ticket_index ASC
            "#,
        )
        .bind(lottery_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(tickets)
    }

    pub async fn find_by_user(&self, user_id: Uuid) -> anyhow::Result<Vec<TicketWithLottery>> {
        let tickets = sqlx::query_as::<_, TicketWithLottery>(
            r#"
            SELECT
                t.id as ticket_id,
                t.ticket_index,
                t.transaction_signature,
                t.purchased_at,
                l.id as lottery_id,
                l.ticket_price,
                l.end_time,
                l.state
            FROM tickets t
            JOIN lotteries l ON t.lottery_id = l.id
            WHERE t.user_id = $1
            ORDER BY purchased_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(tickets)
    }

    pub async fn count_by_lottery(&self, lottery_id: Uuid) -> anyhow::Result<i64> {
        let count: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) FROM tickets WHERE lottery_id = $1
            "#,
        )
        .bind(lottery_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(count.0)
    }

    /// Idempotent insert from a TicketBought event. Resolves the lottery FK from
    /// round_id via a sub-select, and no-ops if this (round, index) already exists.
    pub async fn upsert_for_round(
        &self,
        round_id: i64,
        ticket_index: i64,
        buyer_address: &str,
        signature: &str,
    ) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            INSERT INTO tickets (lottery_id, ticket_index, buyer_address, transaction_signature)
            SELECT l.id, $2, $3, $4
            FROM lotteries l
            WHERE l.round_id = $1
            ON CONFLICT (lottery_id, ticket_index) DO NOTHING
            "#,
        )
        .bind(round_id)
        .bind(ticket_index)
        .bind(buyer_address)
        .bind(signature)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}