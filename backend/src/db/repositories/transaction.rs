use crate::models::{CreateTransaction, Transaction, TransactionType};
use sqlx::PgPool;

pub struct TransactionRepository {
    pool: PgPool,
}

impl TransactionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, create_tx: CreateTransaction) -> anyhow::Result<Transaction> {
        let tx_type_str = match create_tx.tx_type {
            TransactionType::InitializeLottery => "initialize_lottery",
            TransactionType::BuyTicket => "buy_ticket",
            TransactionType::DrawWinner => "draw_winner",
            TransactionType::Payout => "payout",
        };

        let transaction = sqlx::query_as::<_, Transaction>(
            r#"
            INSERT INTO transactions (signature, lottery_id, user_id, tx_type, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING *
            "#,
        )
        .bind(&create_tx.signature)
        .bind(create_tx.lottery_id)
        .bind(create_tx.user_id)
        .bind(tx_type_str)
        .fetch_one(&self.pool)
        .await?;

        Ok(transaction)
    }

    pub async fn update_status(&self, signature: &str, status: &str) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            UPDATE transactions SET status = $2 WHERE signature = $1
            "#,
        )
        .bind(signature)
        .bind(status)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn find_by_signature(&self, signature: &str) -> anyhow::Result<Option<Transaction>> {
        let transaction = sqlx::query_as::<_, Transaction>(
            r#"
            SELECT * FROM transactions WHERE signature = $1
            "#,
        )
        .bind(signature)
        .fetch_optional(&self.pool)
        .await?;

        Ok(transaction)
    }
}
