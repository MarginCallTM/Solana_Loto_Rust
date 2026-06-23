use crate::models::IndexerState;
use sqlx::PgPool;

pub struct IndexerStateRepository {
    pool: PgPool,
}

impl IndexerStateRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // Read the cursos for a given indexer id. None = it never ran.
    pub async fn get(&self, id: &str) -> anyhow::Result<Option<IndexerState>> {
        let state = sqlx::query_as::<_, IndexerState> (
            r#"
            SELECT * FROM indexer_state WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(state)
    }

    // Advance the cursor AFTER a batch has been durably processed.
    // Upsert: INSERT on the first run, UPDATE on every run after.
    pub async fn save_cursor(
        &self,
        id: &str,
        last_signature: &str,
        last_slot: i64,
    ) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            INSERT INTO indexer_state (id, last_signature, last_slot, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id)
            DO UPDATE SET
                last_signature = EXCLUDED.last_signature,
                last_slot = EXCLUDED.last_slot,
                updated_at = NOW()
            "#,
        )
        .bind(id)
        .bind(last_signature)
        .bind(last_slot)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}