use axum::{
    extract::{Path, State},
    Json,
};

use uuid::Uuid;
use crate::{
    api::{dto::*, AppState},
    db::repositories::{LotteryRepository, TicketRepository},
    models::CreateLottery,
    utils::AppError,
};

pub async fn list_lotteries(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<LotteryResponse>>>, AppError> {
    let lottery_repo = LotteryRepository::new(state.db);

    // Get active lottery from database
    let lotteries = lottery_repo.list_active().await?;

    let responses: Vec<LotteryResponse> = lotteries
        .into_iter()
        .map(LotteryResponse::from)
        .collect();

    Ok(Json(ApiResponse::success(responses)))
}

pub async fn get_lottery(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<LotteryResponse>>, AppError> {

    let lottery_repo = LotteryRepository::new(state.db);

    // Find lottery by ID
    let lottery = lottery_repo
        .find_by_id(id)
        .await?
        // Return 404 if not found
        .ok_or_else(|| AppError::NotFound("Lottery not found".to_string()))?;

    Ok(Json(ApiResponse::success(LotteryResponse::from(lottery))))
}

// Create a new lottery (admin only)

// Request body:
/// {
///   "program_account": "Solana program address",
///   "ticket_price": 100000000,  // 0.1 SOL in lamports
///   "end_time": "2024-01-20T20:00:00Z"
/// }

pub async fn create_lottery(
    State(state): State<AppState>,
    Json(req): Json<CreateLotteryRequest>,
) -> Result<Json<ApiResponse<LotteryResponse>>, AppError> {

    tracing::info!("Creating lottery with ticket price: {} lamports", req.ticket_price);

    // VALIDIATION : Ensure ticket price is positive
    if req.ticket_price <= 0 {
        return Err(AppError::BadRequest("Ticket price must be positive".to_string()));
    }

    // VALIDATION: Ensure the end time is in future
    if req.end_time <= chrono::Utc::now() {
        return Err(AppError::BadRequest("End time must be in the future", req.to_string()));
    }

    let lottery_repo = LotteryRepository::new(state.db.clone());

    let admin_id = Uuid::nul(); // Will be remplace with the actual ID

    // Create lottery in Database
    let lottery = lottery_repo
        .create(
            CreateLottery {
                program_account:req.program_account,
                ticket_price: req.ticket_price,
                end_time: req.end_time
            },
            admin_id,
        )
        .await?;

    Ok(Json(ApiReponse::success(LotteryResponse::from(lottery))))
}

pub async fn get_lottery_tickets(
    State(state): State<AppState>,
    Path(lottery_id): Path <Uuid>,
) -> Result<Json<ApiResponse<Vec<TicketResponse>>>, AppError> {

    // VALIDATION : Verify lottery exist first
    let lottery_repo = LotteryRepository::new(state.db.clone());
    lottery_repo
        .find_by_id(lottery_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Lottery not found".to_string()));

    let ticket_repo = TicketRepository::new(state.db);
    let tickets = ticket_repo.find_by_lottery(lottery_id).await?;
    // let ticket_repo = TicketRepository::new(state.db.clone());


    // Convert to responses
    let responses: Vec<TicketResponse> = tickets
        .into_iter()
        .map(TicketResponse::from)
        .collect();

    Ok(Json(ApiResponse::success(responses)))
}
