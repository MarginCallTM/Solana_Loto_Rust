use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

use serde::Serialize;

// Custom error types for our API
// Each variant represents a different kind of error with its own HTTP status

#[derive(Debug)]
pub enum AppError {
    // Database operation failed (500 Interna, Server Error)
    DatabaseError(sqlx::Error),

    // Ressource not found (404 Not found)
    NotFound(String),

    // Invalid request data (400 Bad Request)
    BadRequest(String),

    // Authentication failed (401 Unauthorized)
    Unauthorized(String),

    // Something went wrong on server (500 Internal Server Error)
    InternalServerError(String),
}

// JSON structure for error responses
#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

// COnvert our custom errors into HTTP responses
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::DatabaseError(err) => {
                tracing::error!("Database error : {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Database error: {}", err),
                )
            }
            
            // Client errors - safe to show to user
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),

            // Internal errors - log details, return generic message 
            AppError::InternalServerError(msg) => {
                tracing::error!("Internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, msg)
            }
        };

        // Create JSON response
        let body = Json(ErrorResponse {
            error:status.canonical_reason().unwrap_or("Unknown").to_string(),
            message: error_message,
        });

        (status, body).into_response()
    }

}

impl From<sqlx::Error> for AppError {
    fn from (err: sqlx::Error) -> Self {
        AppError::DatabaseError(err)
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalServerError(err.to_string())
    }
}

