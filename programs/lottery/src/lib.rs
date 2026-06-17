use anchor_lang::prelude::*;

// Placeholder will be replaced by the program's real public key
// (generated on the first 'anchor build') via 'anchor keys sync'
declare_id!("DD5CPAQWUtKSBajtNT9w4QbJysQnuWeDZ6yCdXKAYwro");

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