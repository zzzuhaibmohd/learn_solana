use anchor_lang::prelude::*;

declare_id!("GDJSwaStkPtK5JoRsBDh8J61y9sxPYKci4orqK8CmeVb");

#[program]
pub mod on_chain_voting {
    use super::*;

    pub fn init_vote_bank(ctx: Context<VoteBank>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        ctx.accounts.vote_account.is_open_to_vote = true;
        Ok(())
    }

    pub fn give_vote(ctx: Context<GiveVote>, vote_type: VoteType) -> Result<()> {
        require!(
            ctx.accounts.vote_account.is_open_to_vote,
            VotingError::VotingClosed
        );

        match vote_type {
            VoteType::GM => {
                ctx.accounts.vote_account.gm += 1;
                msg!("Signer Voted GM: {}", ctx.accounts.user.key());
            }
            VoteType::GN => {
                ctx.accounts.vote_account.gn += 1;
                msg!("Signer Voted GN: {}", ctx.accounts.user.key());
            }
        }
        Ok(())
    }

    pub fn close_vote_bank(ctx: Context<CloseVoteBank>) -> Result<()> {
        ctx.accounts.vote_account.is_open_to_vote = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VoteBank<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32,
    )]
    pub vote_account: Account<'info, VoteBankData>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VoteBankData {
    pub is_open_to_vote: bool,
    pub gm: u64,
    pub gn: u64,
}

#[derive(Accounts)]
pub struct GiveVote<'info> {
    #[account(mut)]
    pub vote_account: Account<'info, VoteBankData>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseVoteBank<'info> {
    #[account(mut)]
    pub vote_account: Account<'info, VoteBankData>,
    pub user: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteType {
    GM,
    GN,
}

#[error_code]
pub enum VotingError {
    #[msg("Voting is currently closed")]
    VotingClosed,
}
