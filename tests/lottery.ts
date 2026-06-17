import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import { PublicKey, SendTransactionError } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("lottery", () => {
  // Provider + program, wired from Anchor.toml (localnet + wallet).
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.lottery as Program<Lottery>;

  // Helper: derive the Lottery and Vault PDAs for a given round id.
  const pdasFor = (roundId: anchor.BN) => {
    const roundBytes = roundId.toArrayLike(Buffer, "le", 8);
    const [lottery] = PublicKey.findProgramAddressSync(
      [Buffer.from("lottery"), roundBytes],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), roundBytes],
      program.programId
    );
    return { lottery, vault };
  };

  it("pings the program", async () => {
    const tx = await program.methods.ping().rpc();
    console.log("ping tx signature", tx);
  });

  it("initializes a lottery", async () => {
    const roundId = new anchor.BN(1);
    const ticketPrice = new anchor.BN(100_000_000); // 0.1 SOL in lamports
    const duration = new anchor.BN(3600); // 1 hour
    const { lottery, vault } = pdasFor(roundId);

    await program.methods
      .initializeLottery(roundId, ticketPrice, duration)
      .accounts({
        lottery,
        vault,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Read the on-chain account back and check every field.
    const acc = await program.account.lottery.fetch(lottery);
    assert.ok(acc.roundId.eq(roundId));
    assert.ok(acc.ticketPrice.eq(ticketPrice));
    assert.ok(acc.authority.equals(provider.wallet.publicKey));
    assert.ok(acc.totalTickets.eq(new anchor.BN(0)));
    assert.ok(acc.potAmount.eq(new anchor.BN(0)));
    assert.equal(acc.winnerIndex, null);
    assert.equal(acc.claimed, false);
    assert.deepEqual(acc.state, { open: {} });
  });

  it("rejects a non-positive duration", async () => {
    const roundId = new anchor.BN(2);
    const ticketPrice = new anchor.BN(100_000_000);
    const duration = new anchor.BN(0); // invalid
    const { lottery, vault } = pdasFor(roundId);

    try {
      await program.methods
        .initializeLottery(roundId, ticketPrice, duration)
        .accounts({
          lottery,
          vault,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(anchor.AnchorError);
      assert.equal(err.error.errorCode.code, "InvalidDuration");
    }
  });

  it("rejects creating the same round twice", async () => {
    const roundId = new anchor.BN(1); // already created in the first test
    const ticketPrice = new anchor.BN(100_000_000);
    const duration = new anchor.BN(3600);
    const { lottery, vault } = pdasFor(roundId);

    try {
      await program.methods
        .initializeLottery(roundId, ticketPrice, duration)
        .accounts({
          lottery,
          vault,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      // Re-creating an existing PDA is rejected on-chain (account already in use):
      // the transaction fails, surfaced by web3.js as a SendTransactionError.
      expect(err).to.be.instanceOf(SendTransactionError);
    }
  });
});
