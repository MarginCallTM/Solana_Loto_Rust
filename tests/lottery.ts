import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import {
  PublicKey,
  SendTransactionError,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
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

  // Helper: derive the Ticket PDA for a given round id and ticket index.
  const ticketPdaFor = (roundId: anchor.BN, index: anchor.BN) => {
    const [ticket] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ticket"),
        roundId.toArrayLike(Buffer, "le", 8),
        index.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    return ticket;
  };

  // Helper: create a round owned by the provider wallet.
  const initRound = async (
    roundId: anchor.BN,
    ticketPrice: anchor.BN,
    duration: anchor.BN
  ) => {
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
    return { lottery, vault };
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Helper: buy one ticket at the given index from the provider wallet.
  const buyOneTicket = async (
    roundId: anchor.BN,
    lottery: PublicKey,
    vault: PublicKey,
    index: anchor.BN
  ) => {
    const ticket = ticketPdaFor(roundId, index);
    await program.methods
      .buyTicket()
      .accounts({
        lottery,
        vault,
        ticket,
        buyer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
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

  it("buys a ticket and funds the vault", async () => {
    const roundId = new anchor.BN(10);
    const ticketPrice = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const { lottery, vault } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(3600)
    );
    const ticket = ticketPdaFor(roundId, new anchor.BN(0));

    await program.methods
      .buyTicket()
      .accounts({
        lottery,
        vault,
        ticket,
        buyer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Ticket account is correct.
    const ticketAcc = await program.account.ticket.fetch(ticket);
    assert.ok(ticketAcc.roundId.eq(roundId));
    assert.ok(ticketAcc.buyer.equals(provider.wallet.publicKey));
    assert.ok(ticketAcc.index.eq(new anchor.BN(0)));

    // Lottery counters updated.
    const lotteryAcc = await program.account.lottery.fetch(lottery);
    assert.ok(lotteryAcc.totalTickets.eq(new anchor.BN(1)));
    assert.ok(lotteryAcc.potAmount.eq(ticketPrice));

    // Vault actually holds the lamports.
    const vaultBalance = await provider.connection.getBalance(vault);
    assert.equal(vaultBalance, ticketPrice.toNumber());
  });

  it("buys several tickets with consistent indexes and pot", async () => {
    const roundId = new anchor.BN(11);
    const ticketPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const { lottery, vault } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(3600)
    );

    const count = 3;
    for (let i = 0; i < count; i++) {
      const ticket = ticketPdaFor(roundId, new anchor.BN(i));
      await program.methods
        .buyTicket()
        .accounts({
          lottery,
          vault,
          ticket,
          buyer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }

    const lotteryAcc = await program.account.lottery.fetch(lottery);
    assert.ok(lotteryAcc.totalTickets.eq(new anchor.BN(count)));
    assert.ok(lotteryAcc.potAmount.eq(ticketPrice.muln(count)));

    const vaultBalance = await provider.connection.getBalance(vault);
    assert.equal(vaultBalance, ticketPrice.toNumber() * count);
  });

  it("rejects buying with insufficient funds", async () => {
    const roundId = new anchor.BN(12);
    const ticketPrice = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const { lottery, vault } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(3600)
    );
    const ticket = ticketPdaFor(roundId, new anchor.BN(0));

    // A fresh buyer with far less SOL than the ticket price.
    const poorBuyer = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      poorBuyer.publicKey,
      0.01 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    try {
      await program.methods
        .buyTicket()
        .accounts({
          lottery,
          vault,
          ticket,
          buyer: poorBuyer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([poorBuyer])
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      // The transfer fails for lack of lamports, so the whole tx is rejected.
      // Assert the side effect never happened: no ticket was recorded.
      const lotteryAcc = await program.account.lottery.fetch(lottery);
      assert.ok(lotteryAcc.totalTickets.eq(new anchor.BN(0)));
    }
  });

  it("rejects buying after the deadline", async () => {
    const roundId = new anchor.BN(13);
    const ticketPrice = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const { lottery, vault } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(1) // 1-second round
    );
    const ticket = ticketPdaFor(roundId, new anchor.BN(0));

    // Wait past the deadline.
    await sleep(2000);

    try {
      await program.methods
        .buyTicket()
        .accounts({
          lottery,
          vault,
          ticket,
          buyer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(anchor.AnchorError);
      assert.equal(err.error.errorCode.code, "SalesEnded");
    }
  });

  it("draws a winner within bounds after the deadline", async () => {
    const roundId = new anchor.BN(20);
    const ticketPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const { lottery, vault } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(2) // short round
    );

    // Buy 3 tickets, then let the round expire.
    const count = 3;
    for (let i = 0; i < count; i++) {
      await buyOneTicket(roundId, lottery, vault, new anchor.BN(i));
    }
    await sleep(2500);

    await program.methods
      .drawWinner()
      .accounts({ lottery, authority: provider.wallet.publicKey })
      .rpc();

    const acc = await program.account.lottery.fetch(lottery);
    assert.deepEqual(acc.state, { closed: {} });
    assert.isNotNull(acc.winnerIndex);
    // winner_index must be a valid ticket index in [0, total_tickets).
    const winner = acc.winnerIndex.toNumber();
    assert.isAtLeast(winner, 0);
    assert.isBelow(winner, count);
  });

  it("closes a round with no winner when no ticket was sold", async () => {
    const roundId = new anchor.BN(21);
    const ticketPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const { lottery } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(1)
    );
    await sleep(2000);

    await program.methods
      .drawWinner()
      .accounts({ lottery, authority: provider.wallet.publicKey })
      .rpc();

    const acc = await program.account.lottery.fetch(lottery);
    assert.deepEqual(acc.state, { closed: {} });
    assert.isNull(acc.winnerIndex);
  });

  it("rejects drawing before the deadline", async () => {
    const roundId = new anchor.BN(22);
    const ticketPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const { lottery } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(3600) // far in the future
    );

    try {
      await program.methods
        .drawWinner()
        .accounts({ lottery, authority: provider.wallet.publicKey })
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(anchor.AnchorError);
      assert.equal(err.error.errorCode.code, "TooEarlyToDraw");
    }
  });

  it("rejects drawing by a non-authority", async () => {
    const roundId = new anchor.BN(23);
    const ticketPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const { lottery } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(1)
    );
    await sleep(2000);

    // A different signer that is not the round's authority.
    const intruder = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      intruder.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    try {
      await program.methods
        .drawWinner()
        .accounts({ lottery, authority: intruder.publicKey })
        .signers([intruder])
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(anchor.AnchorError);
      assert.equal(err.error.errorCode.code, "Unauthorized");
    }
  });

  it("rejects drawing twice", async () => {
    const roundId = new anchor.BN(24);
    const ticketPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const { lottery, vault } = await initRound(
      roundId,
      ticketPrice,
      new anchor.BN(2)
    );
    await buyOneTicket(roundId, lottery, vault, new anchor.BN(0));
    await sleep(2500);

    // First draw succeeds.
    await program.methods
      .drawWinner()
      .accounts({ lottery, authority: provider.wallet.publicKey })
      .rpc();

    // Second draw must be rejected (round is already Closed).
    try {
      await program.methods
        .drawWinner()
        .accounts({ lottery, authority: provider.wallet.publicKey })
        .rpc();
      assert.fail("expected the instruction to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(anchor.AnchorError);
      assert.equal(err.error.errorCode.code, "LotteryNotOpen");
    }
  });
});
