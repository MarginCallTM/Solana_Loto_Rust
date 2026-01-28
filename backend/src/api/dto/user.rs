use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// Request body for POST/api/ users/connect
#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectWalletRequest {
    pub wallet_address: String,
    pub username: Option<String>,
}


#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub wallet_address: String,
    pub username: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<crate::models::User> for UserResponse {
    fn from(user: crate::models::User) -> Self {
        Self {
            id: user.id,
            wallet_address: user.wallet_address,
            username: user.username,
            created_at: user.created_at,
        }
    }
}