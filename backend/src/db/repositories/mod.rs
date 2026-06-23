pub mod user;
pub mod lottery;
pub mod ticket;
pub mod transaction;
pub mod indexer_state;

pub use user::UserRepository;
pub use lottery::LotteryRepository;
pub use ticket::TicketRepository;
pub use transaction::TransactionRepository;
pub use indexer_state::IndexerStateRepository;

#[cfg(test)]
mod tests;