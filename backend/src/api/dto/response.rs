use serde::Serialize;

// Standard successful response wrapper
// All sucessful responses use this format

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: T,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data,
        }
    }
}

// Paginated response for Lists

#[derive(Serialize)]
pub struct PaginatedResponse<T> {
    pub success: bool,
    pub data: Vec<T>,
    pub total: usize,
    pub page: usize,
    pub per_page: usize,
}

// Simple message response
#[derive(Serialize)]
pub struct MessageResponse {
    pub message: String,
}

impl MessageResponse {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message:message.into(),
        }
    }
}