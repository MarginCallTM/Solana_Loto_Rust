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

    pub fn initialize_lottery(
        ctx: Context<InitializeLottery>,
        round_id: u64,
        ticket_price: u64,
        duration: i64,
    ) -> Result<()> {
        // Reject non-positive durations (a round must last some time)
        require!(duration > 0, LotteryError::InvalidDuration);

        // Read the on-chain clock to compute the round deadline.
        let now = Clock::get()?.unix_timestamp;
        let end_timestamp = now
            .checked_add(duration)
            .ok_or(LotteryError::MathOverflow)?;

        // Fill the freshly created Lottery account.
        let lottery = &mut ctx.accounts.lottery;
        lottery.round_id = round_id;
        lottery.authority = ctx.accounts.authority.key();
        lottery.ticket_price = ticket_price;
        lottery.total_tickets = 0;
        lottery.pot_amount = 0;
        lottery.end_timestamp = end_timestamp;
        lottery.state = LotteryState::Open;
        lottery.winner_index = None;
        lottery.claimed = false;
        lottery.bump = ctx.bumps.lottery;
        lottery.vault_bump = ctx.bumps.vault;

        emit!(LotteryInitialized {
            round_id,
            authority: lottery.authority,
            ticket_price,
            end_timestamp,
        });
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        // 1. Guards: refuse if the round is not open or sales habe ended.
        require!(
            ctx.accounts.lottery.state == LotteryState::Open,
            LotteryError::LotteryNotOpen
        );
        let now = Clock::get()?.unix_timestamp;
        require!(
            now < ctx.accounts.lottery.end_timestamp,
            LotteryError::SalesEnded
        );

        // 2. Read what we need before mutating anything.
        let ticket_price = ctx.accounts.lottery.ticket_price;
        let index = ctx.accounts.lottery.total_tickets;

        // 3. Transfer the ticket price from the buyer to the vault (CPI).
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_ctx, ticket_price)?;

        // 4. Fill the freshly created Ticket account.
        let ticket = &mut ctx.accounts.ticket;
        ticket.round_id = ctx.accounts.lottery.round_id;
        ticket.buyer = ctx.accounts.buyer.key();
        ticket.index = index;
        ticket.bump = ctx.bumps.ticket;

        // 5. Update the lottery counters (checked arithmetic).
        let lottery = &mut ctx.accounts.lottery;
        lottery.total_tickets = lottery
            .total_tickets
            .checked_add(1)
            .ok_or(LotteryError::MathOverflow)?;
        lottery.pot_amount = lottery
            .pot_amount
            .checked_add(ticket_price)
            .ok_or(LotteryError::MathOverflow)?;

        // 6. Emit the event for the off-chain indexer.
        emit!(TicketBought {
            round_id: lottery.round_id,
            buyer: ticket.buyer,
            index,
        });

        Ok(())
    }

    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        // Guard: the round must still be open (not already drawn).
        require!(
            ctx.accounts.lottery.state == LotteryState::Open,
            LotteryError::LotteryNotOpen
        );
        // Guard: only allowed once the deadline has passed.
        let now = Clock::get()?.unix_timestamp;
        require!(
            now >= ctx.accounts.lottery.end_timestamp,
            LotteryError::TooEarlyToDraw
        );

        let lottery = &mut ctx.accounts.lottery;

        if lottery.total_tickets == 0 {
            // No ticket sold: close the round with no winner. Never panic
            lottery.winner_index = None;
        } else {
            let index = pseudo_random_index(lottery.total_tickets, now)?;
            lottery.winner_index = Some(index);
        }

        lottery.state = LotteryState::Closed;

        emit!(WinnerDrawn {
            round_id: lottery.round_id,
            winner_index: lottery.winner_index,
        });

        Ok(())
    }

    pub fn payout(ctx: Context<Payout>) -> Result<()> {
        // -- Checks ---
        require!(
            ctx.accounts.lottery.state == LotteryState::Closed,
            LotteryError::LotteryNotClosed
        );
        require!(!ctx.accounts.lottery.claimed, LotteryError::AlreadyClaimed);
        let winner_index = ctx
            .accounts
            .lottery
            .winner_index
            .ok_or(LotteryError::NoWinner)?;
        require!(
            ctx.accounts.ticket.index == winner_index,
            LotteryError::NotTheWinner
        );

        let amount = ctx.accounts.lottery.pot_amount;
        let round_bytes = ctx.accounts.lottery.round_id.to_le_bytes();
        let vault_bump = ctx.accounts.lottery.vault_bump;

        // -- Effect: Mark claimed BEFORE the transfer (checks-effects-interactions) ---
        ctx.accounts.lottery.claimed = true;

        // -- Interaction: move the pot from the vault PDA to the winner ---
        // The vault has no private key: the program signs for it with its seeds.
        let signer_seeds: &[&[&[u8]]] = &[&[VAULT_SEED, &round_bytes, &[vault_bump]]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.winner.to_account_info(),
            },
            signer_seeds,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        emit!(PrizeClaimed {
            round_id: ctx.accounts.lottery.round_id,
            winner: ctx.accounts.winner.key(),
            amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct InitializeLottery<'info> {
    // The lottery account being created (a PDA)
    #[account(
        init,
        payer = authority,
        space = Lottery::LEN,
        seeds = [LOTTERY_SEED, &round_id.to_le_bytes()],
        bump
    )]
    pub lottery: Account<'info, Lottery>,

    // The vault PDA that will hold the SOL pot. Not created here: a lamport-only
    // PDA is funded lazily on the first ticket payment (System Program creates it
    // on transfer). We declare it just to derive and store its canonical bump.
    #[account(
        seeds = [VAULT_SEED, &round_id.to_le_bytes()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    // The round creator: signs, pays for account creation, becomes authority.
    #[account(mut)]
    pub authority: Signer<'info>,

    // Required by Anchor to create accounts (CPI to the System Program)
    pub system_program: Program<'info, System>,

}



#[derive(Accounts)]
pub struct BuyTicket<'info> {
    // The round being played. Re-derived from its own stored round_id + bump.
    #[account(
        mut,
        seeds = [LOTTERY_SEED, &lottery.round_id.to_le_bytes()],
        bump = lottery.bump,
    )]
    pub lottery: Account<'info, Lottery>,

    // The pot. Mutable because it receives the ticket payment.
    #[account(
        mut,
        seeds = [VAULT_SEED, &lottery.round_id.to_le_bytes()],
        bump = lottery.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    // The ticket being created, at index = current total_tickets.
    #[account(
        init,
        payer = buyer,
        space = Ticket::LEN,
        seeds = [TICKET_SEED, &lottery.round_id.to_le_bytes(), &lottery.total_tickets.to_le_bytes()],
        bump,
    )]
    pub ticket: Account<'info, Ticket>,

    // The player: signs and pays (ticket price + ticket account rent).
    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    // Only the round's authority may draw. 'has_one' checks lottery.authority == authority.
    #[account(
        mut,
        seeds = [LOTTERY_SEED, &lottery.round_id.to_le_bytes()],
        bump = lottery.bump,
        has_one = authority @ LotteryError::Unauthorized,
    )]
    pub lottery: Account<'info, Lottery>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Payout<'info> {
    #[account(
        mut,
        seeds = [LOTTERY_SEED, &lottery.round_id.to_le_bytes()],
        bump = lottery.bump,
    )]
    pub lottery: Account<'info, Lottery>,
    
    // The pot. Mutable because lamports leave it.
    #[account(
        mut,
        seeds = [VAULT_SEED, &lottery.round_id.to_le_bytes()],
        bump = lottery.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    // The winning ticket: its address must derive from THIS round + ticket.index.
    #[account(
        seeds = [TICKET_SEED, &lottery.round_id.to_le_bytes(), &ticket.index.to_le_bytes()],
        bump = ticket.bump,
    )]
    pub ticket: Account<'info, Ticket>,

    // The recipient: Must be the buyer of the winning ticket (push model).
    #[account(
        mut,
        address = ticket.buyer @ LotteryError::NotTheWinner,
    )]
    pub winner: SystemAccount<'info>,

    // Anyone can pay the tx fee and trigger the payout (a cron, typically).
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
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

// ⚠️  INSECURE ON-CHAIN RANDOMNESS — DEVNET ONLY.
// This mixes the most recent slot hash, the current unix time and the ticket
// count into a single number, then reduces it modulo `total_tickets`.
//
// A block-producing validator can influence the slot hash and the timestamp,
// so this draw IS MANIPULABLE by a validator and MUST be replaced by a
// verifiable source (Switchboard VRF) before any real-value use. See PROD.1.
//
// Isolated on purpose (D29): swapping in VRF later should not touch draw_winner.
fn pseudo_random_index(total_tickets: u64, now: i64) -> Result<u64> {
    // Recent slot hashes sysvar gives a recent block hash on-chain entropy.
    let recent = Clock::get()?.slot;
    let seed = (recent as u128)
        .wrapping_mul(6364136223846793005)
        .wrapping_add(now as u128)
        .wrapping_add(total_tickets as u128);
    Ok((seed % total_tickets as u128) as u64)
}

// Lifecycle of a lottery round.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LotteryState {
    Open, // tickets can be bought
    Drawing,
    Closed,
}

// Emitted when a new round is created. Consumed off-chain by the indexer.
#[event]
pub struct LotteryInitialized {
    pub round_id: u64,
    pub authority: Pubkey,
    pub ticket_price: u64,
    pub end_timestamp: i64,
}

// Emitted on each ticket purchase. Consumed off-chain by the indexer
#[event]
pub struct TicketBought {
    pub round_id: u64,
    pub buyer: Pubkey,
    pub index: u64,
}

// Emitted when a round is drawn. winner_index is None if no ticket was sold.
#[event]
pub struct WinnerDrawn {
    pub round_id: u64,
    pub winner_index: Option<u64>,
}

// Emitted when the pot is paid out to the winner.
#[event]
pub struct PrizeClaimed {
    pub round_id: u64,
    pub winner: Pubkey,
    pub amount: u64,
}

// Custum program errors. Anchor numbers them starting at 6000
#[error_code]
pub enum LotteryError {
    #[msg("Duration must be strictly positive.")]
    InvalidDuration,
    #[msg("The lottery is not open for ticket sales.")]
    LotteryNotOpen,
    #[msg("Ticket sales have ended for this round.")]
    SalesEnded,
    #[msg("Too early to draw: the round has not ended yet.")]
    TooEarlyToDraw,
    #[msg("The lottery is not closed yet.")]
    LotteryNotClosed,
    #[msg("There is no winner to pay out for this round.")]
    NoWinner,
    #[msg("Signer is not the winner of this round.")]
    NotTheWinner,
    #[msg("The prize has already been claimed.")]
    AlreadyClaimed,
    #[msg("Arithmetic overflow.")]
    MathOverflow,
    #[msg("Signer is not the authority of this round.")]
    Unauthorized,
}