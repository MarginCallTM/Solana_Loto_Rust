use crate::models::{CreateUser, User};
use sqlx::PgPool;
use uuid::Uuid;

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, create_user: CreateUser) -> anyhow::Result<User> {
        let user: User = sqlx::query_as(
            r#"
            INSERT INTO users (wallet_address, username)
            VALUES ($1, $2)
            RETURNING id, wallet_address, username, created_at
            "#,
        )
        .bind(&create_user.wallet_address)
        .bind(&create_user.username)
        .fetch_one(&self.pool)
        .await?;

        tracing::info!("Created user: {} ({})", user.wallet_address, user.id);

        Ok(user)
    }

    pub async fn find_by_id(&self, id: Uuid) -> anyhow::Result<Option<User>> {
        let user: Option<User> = sqlx::query_as(
            r#"
            SELECT id, wallet_address, username, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_wallet(&self, wallet_address: &str) -> anyhow::Result<Option<User>> {
        let user = sqlx::query_as::<_,User>(
            r#"
            SELECT id, wallet_address, username, created_at, updated_at
            FROM users
            WHERE wallet_address = $1
            "#,
        )
        .bind(wallet_address)
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn find_or_create(&self, wallet_address: &str) -> anyhow::Result<User> {
        if let Some(user) = self.find_by_wallet(wallet_address).await? {
            return Ok(user);
        }

        self.create(CreateUser {
            wallet_address: wallet_address.to_string(),
            username: None,
        })
        .await
    }
}
