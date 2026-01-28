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
            INSERT INTO tickets (lottery_id, user_id, ticket_number, transaction_signature)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(create_ticket.lottery_id)
        .bind(create_ticket.user_id)
        .bind(create_ticket.ticket_number)
        .bind(&create_ticket.transaction_signature)
        .fetch_one(&self.pool)
        .await?;

        tracing::info!(
            "Created ticker #{} for lottery {} (user: {})",
            ticket.ticket_number,
            ticket.lottery_id,
            ticket.user_id
        );

        Ok(ticket)
    }

    pub async fn find_by_lottery(&self, lottery_id: Uuid) -> anyhow::Result<Vec<Ticket>> {
        let tickets = sqlx::query_as::<_, Ticket> (
            r#"
            SELECT * FROM tickets
            WHERE lottery_id = $1
            ORDER BY ticket_number ASC
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
                t.ticket_number,
                t.transaction_signature,
                t.purchased_at,
                l.id as lottery_id,
                l.ticket_price,
                l.end_time,
                l.is_finalized
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
}