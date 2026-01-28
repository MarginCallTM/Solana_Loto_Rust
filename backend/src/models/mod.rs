pub mod user;
pub mod lottery;
pub mod ticket;
pub mod transaction;

pub use user::{User, CreateUser, UpdateUser};
pub use lottery::{Lottery, CreateLottery, LotteryStats};
pub use ticket::{Ticket, CreateTicket, TicketWithLottery};
pub use transaction::{Transaction, CreateTransaction, TransactionType, TransactionStatus};