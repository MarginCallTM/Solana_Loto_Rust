use anchor_lang::prelude::*;

// Placeholder will be replaced by the program's real public key
// (generated on the first 'anchor build') via 'anchor keys sync'
declare_id!("DD5CPAQWUtKSBajtNT9w4QbJysQnuWeDZ6yCdXKAYwro");

// PDA seed prefixes. Single source of truth to avoid typos across instructions.

// PDA derivations:
//  Lottery: [LOTTERY_SEED, round_id.to_le_bytes()]
//  Vault: [VAULT_SEED, round_id.to_le_bytes()]
//  Ticket: [TICKET_SEED, round_id.to_le_bytes(), index.to_le_bytes()]
pub const LOTTERY_SEED: &[u8] = b"lottery";
pub const VAULT_SEED: &[u8] = b"vault";
pub const TICKET_SEED: &[u8] = b"ticket";


#[program]
pub mod lottery {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("lottery program: ping ok");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping {}

// On-chain state of one lottery round. This is PDA: address derived
// from seeds ["lottery", round_id] + the program id.
#[account]
pub struct Lottery {
    pub round_id: u64,      // round identifier (also a PDA seed)
    pub authority: Pubkey,      // the only signer allowed to draw the winner
    pub ticket_price: u64,      // price of the ticket, in lamports
    pub total_tickets: u64,     // number of tickets sold so far
    pub pot_amount: u64,        // total lamports collected in the vault
    pub end_timestamp: i64,     // unix time; sales close once now >= this
    pub state: LotteryState,        // Open / Drawing / Closed
    pub winner_index: Option<u64>,  // Winning ticket index, set once drawn
    pub claimed: bool,      // true once the prize has been paid out (anti double-claim)
    pub bump: u8,       // PDA bump of this lottery account
    pub vault_bump: u8,     // PDA bump of the associated Vault
}

impl Lottery {
    // Total on-chain size, used as 'space' when the account is created.
    pub const LEN: usize = 8        // account discriminator
        + 8     // round_id: u64
        + 32    // authority: Pubkey
        + 8     // ticket_price: u64
        + 8     // total_ticket: u64
        + 8     // pot_amount: u64
        + 8     // end_timestamp: i64
        + 1     // state: LotteryState (enum tag)
        + 9     // winner_index: Option<u64> (1 tag + 8 value)
        + 1     // claimed: bool
        + 1     // bump: u8
        + 1;     // vault_bump: u8
}

#[account]
pub struct Ticket {
    pub round_id: u64,      // which round this ticket belongs to
    pub buyer: Pubkey,      // who bought it, the winner claims with this key
    pub index: u64,         // ticket number within the round, in [0, total_tickets)
    pub bump: u8,           // PDA bump of this Ticket account
}

impl Ticket {
    pub const LEN: usize = 8 // account discriminator
        + 8     // round_id: u64
        + 32    // buyer: Pubkey
        + 8     // index: u64
        + 1;    // bump: u8
}

// Lifecycle of a lottery round.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LotteryState {
    Open, // tickets can be bought
    Drawing,
    Closed,
}

// Custum program errors. Anchor numbers them starting at 6000
#[error_code]
pub enum LotteryError {
    #[msg("Duration must be stricly positive.")]
    InvalidDuration,
    #[msg("Then lottery is not open for ticket sales.")]
    LotteryNotOpen,
    #[msg("Ticket sales have ended for this round.")]
    SalesEnded,
    #[msg("Too early to draw: the round has not ended yet.")]
    TooEarlyToDraw,
    #[msg("The lottery is not closed yet.")]
    LotteryNotClosed,
    #[msg("There is no winner to pay out for this round.")]
    NoWinner,
    #[msg("Signer is not the winner of this round")]
    NotTheWinner,
    #[msg("The price has already been claimed")]
    AlreadyClaimed,
    #[msg("Arithmetic overflow")]
    MathOverFlow,
}