use axum:: {
    extract::{Path, State},
    Json,
};

use crate::{
    api::{dto::*, AppState},
    db::repositories::UserRepository,
    utils::AppError,
};


pub async fn connect_wallet(
    State(state): State<AppState>,
    Json(req): Json<ConnectWalletRequest>,
)  -> Result<Json<ApiResponse<UserResponse>>, AppError> {

    tracing::info!("Connecting wallet: {}", req.wallet_address);

    // Create repository (Handle Database operations)
    let user_repo = UserRepository::new(state.db);

    // Find existing user or create new one
    let user = user_repo.find_or_create(&req.wallet_address).await? ;

    // Convert database User to API UserResponse
    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}

// Get user by wallet address
/// 
/// Example: GET /api/users/7x9GmK3MqPxYz2nN5B8kL4vR1sT6wU
/// 
/// Why: Frontend needs to check if user exists, get their info

pub async fn get_user(
    State(state): State<AppState>,
    Path(wallet): Path<String>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {

    let user_repo = UserRepository::new(state.db);

    // Try to find user
    let user = user_repo
        .find_by_wallet(&wallet)
        .await?
        // If not found error 404
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}
