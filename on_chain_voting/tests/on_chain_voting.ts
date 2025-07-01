import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnChainVoting } from "../target/types/on_chain_voting";
import { assert } from "chai";
import { BN } from "bn.js";

describe("on_chain_voting", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.onChainVoting as Program<OnChainVoting>;

  let voteBank = anchor.web3.Keypair.generate();
  let voterOne = anchor.web3.Keypair.generate();
  let voterTwo = anchor.web3.Keypair.generate();

  beforeEach(async () => {

    voteBank = anchor.web3.Keypair.generate();
    voterOne = anchor.web3.Keypair.generate();
    voterTwo = anchor.web3.Keypair.generate();
    // Create a vote bank
    await program.methods.initVoteBank().accounts({
      voteAccount: voteBank.publicKey,
    })
    .signers([voteBank])
    .rpc();
  });

  it("is initialized", async () => {
    let voteBankData = await program.account.voteBankData.fetch(voteBank.publicKey);
    assert.isTrue(voteBankData.isOpenToVote);
  });

  it("give a GM vote", async () => {
    const tx = await program.methods.giveVote({ gm: {} }).accounts({
      voteAccount: voteBank.publicKey,
      user: voterOne.publicKey,
    })
    .signers([voterOne])
    .rpc();

    const voteBankData = await program.account.voteBankData.fetch(voteBank.publicKey);
    assert.equal(voteBankData.gm, 1);
    assert.equal(voteBankData.gn, 0);
  });

  it("give a GN vote", async () => {
    const tx = await program.methods.giveVote({ gn: {} }).accounts({
      voteAccount: voteBank.publicKey,
      user: voterTwo.publicKey,
    })
    .signers([voterTwo])
    .rpc();

    const voteBankData = await program.account.voteBankData.fetch(voteBank.publicKey);
    assert.equal(voteBankData.gm, 0);
    assert.equal(voteBankData.gn, 1);
  });

  it("close the vote bank", async () => {
    let voteBankData = await program.account.voteBankData.fetch(voteBank.publicKey);
    assert.isTrue(voteBankData.isOpenToVote);

    const tx = await program.methods.closeVoteBank().accounts({
      voteAccount: voteBank.publicKey,
      user: voteBank.publicKey,
    })
    .signers([voteBank])
    .rpc();

    voteBankData = await program.account.voteBankData.fetch(voteBank.publicKey);
    assert.isFalse(voteBankData.isOpenToVote);
  });

  it("try to give a vote after the vote bank is closed", async () => {
    // First close the vote bank
    await program.methods.closeVoteBank().accounts({
      voteAccount: voteBank.publicKey,
      user: voteBank.publicKey,
    })
    .signers([voteBank])
    .rpc();

    // Try to give a vote after the vote bank is closed - this should fail
    try {
      await program.methods.giveVote({ gm: {} }).accounts({
        voteAccount: voteBank.publicKey,
        user: voterOne.publicKey,
      })
      .signers([voterOne])
      .rpc();
      
      // If we reach here, the test should fail because we expected an error
      assert.fail("Expected transaction to fail with VotingClosed error");
    } catch (error) {
      assert.equal(error.error.errorCode.code, "VotingClosed");
      assert.equal(error.error.errorMessage, "Voting is currently closed");
    }
  });
});