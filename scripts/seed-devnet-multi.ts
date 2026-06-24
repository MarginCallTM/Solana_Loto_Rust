// Seed devnet with a 5-distinct-buyers round: watch the draw pick one winner
// among real, separate wallets and pay the pot to exactly that buyer.
//
// Funding: the main wallet transfers a little SOL to each fresh buyer (reliable,
// no faucet rate-limit). This validates the MECHANICS end-to-end (5 buyers ->
// 1 winner -> correct payout); it does NOT prove the RNG is statistically fair
// (that needs many rounds), and the RNG is still validator-manipulable (PROD.1).
//
// Run:
//   yarn run ts-mocha -p ./tsconfig.json -t 1000000 "scripts/seed-devnet-multi.ts"

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import {
    PublicKey,
    LAMPORTS_PER_SOL,
    Keypair,
    SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";

describe("seed devnet (5 buyers)", () => {
    it("runs a round with 5 distinct buyers and pays the winner", async () => {
        // --- 1. Wire devnet manually (NOT anchor.workspace, which is localnet) ---
        const connection = new anchor.web3.Connection(
            "https://api.devnet.solana.com",
            "confirmed"
        );
        const secret = JSON.parse(
            fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
        );
        const keypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(secret));
        const wallet = new anchor.Wallet(keypair);
        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });
        anchor.setProvider(provider);

        const idl = JSON.parse(fs.readFileSync("./target/idl/lottery.json", "utf8"));
        const program = new Program<Lottery>(idl as Lottery, provider);

        // --- 2. Five fresh, throwaway buyer wallets ---
        const buyers = Array.from({length: 5}, () => Keypair.generate());
        buyers.forEach((b, i) =>
            console.log(`buyer[${i}] :`, b.publicKey.toBase58())
        );

        // --- 2b. Ticket price + purchase plan: who buys each ticket, in order.
        //          Buyers 0 and 1 buy TWICE -> 7 tickets total. The Ticket PDA is
        //          seeded by the GLOBAL index lottery.total_tickets (NOT by buyer),
        //          so a buyer with 2 tickets simply owns 2 accounts at 2 indices. ---
        const ticketPrice = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
        const purchases = [
            buyers[0],
            buyers[1],
            buyers[2],
            buyers[3],
            buyers[4],
            buyers[0],
            buyers[1],
        ];

        // --- 3. Fund each buyer from the main wallet (one tx, 5 transfers) ---
        //          Transfer instead of faucet airdrop: reliable, no rate-limit.
        const buffer = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
        const fundTx = new anchor.web3.Transaction();
        for (const b of buyers) {
            const count = purchases.filter((p) => p === b).length;
            const amount = ticketPrice.muln(count).add(buffer);
            fundTx.add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: b.publicKey,
                    lamports: amount.toNumber(),
                })
            );
        }
        const fundSig = await provider.sendAndConfirm(fundTx);
        console.log("fund  :", fundSig);

        // --- 4. A fresh round (PDA seeded by round_id, so reuse would fail) ---
        const roundId = new anchor.BN(Math.floor(Date.now() / 1000));
        const duration = new anchor.BN(90); // enough for 5 sequential buys on devnet

        const roundBytes = roundId.toArrayLike(Buffer, "le", 8);
        const [lottery] = PublicKey.findProgramAddressSync(
            [Buffer.from("lottery"), roundBytes],
            program.programId
        );
        const [vault] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), roundBytes],
            program.programId
        );
        const ticketPda = (index: number) =>
            PublicKey.findProgramAddressSync(
                [
                    Buffer.from("ticket"),
                    roundBytes,
                    new anchor.BN(index).toArrayLike(Buffer, "le", 8),
                ],
                program.programId
            )[0];
        console.log("round id:", roundId.toString());
        console.log("lottery :", lottery.toBase58());

        // --- 5. initialize_lottery (authority = main wallet) ---
        await program.methods
            .initializeLottery(roundId, ticketPrice, duration)
            .accounts({
                lottery,
                vault,
                authority: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        // --- 6. Run the purchase plan. The ticket index is the GLOBAL running
        //        counter (i), which matches lottery.total_tickets at each buy. ---
        for (let i = 0; i < purchases.length; i++) {
            const buyer = purchases[i];
            await program.methods
                .buyTicket()
                .accounts({
                    lottery,
                    vault,
                    ticket: ticketPda(i),
                    buyer: buyer.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([buyer])
                .rpc();
            console.log(`buy[${i}]    :`, buyer.publicKey.toBase58());
        }

        // --- 7. Wait for the on-chain clock to pass end_timestamp ---
        const deadline = (
            await program.account.lottery.fetch(lottery)
        ).endTimestamp.toNumber();
        for (;;) {
            const slot = await connection.getSlot();
            const t = await connection.getBlockTime(slot);
            if (t !== null && t > deadline) break;
            await new Promise((r) => setTimeout(r, 1000));
        }

        // --- 8. draw_winner ---
        await program.methods
            .drawWinner()
            .accounts({ lottery, authority: wallet.publicKey })
            .rpc();

        const drawn = await program.account.lottery.fetch(lottery);
        const winnerIndex = drawn.winnerIndex.toNumber();
        // winnerIndex is a TICKET index (0..6), not a buyer index: map it back
        // to the buyer that bought that ticket via the purchase plan.
        const winner = purchases[winnerIndex];
        console.log("winner idx:", winnerIndex);
        console.log("winner    :", winner.publicKey.toBase58());

        // --- 9. payout to the winning buyer; the delta must equal the pot ---
        const before = await connection.getBalance(winner.publicKey);
        await program.methods
            .payout()
            .accounts({
                lottery,
                vault,
                ticket: ticketPda(winnerIndex),
                winner: winner.publicKey,
                payer: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        const after = await connection.getBalance(winner.publicKey);

        const pot = ticketPrice.toNumber() * purchases.length;
        console.log("pot       :", pot / LAMPORTS_PER_SOL, "SOL");
        console.log("delta     :", (after - before) / LAMPORTS_PER_SOL, "SOL");

        // --- 10. Final balance of every throwaway wallet (winner marked).
        //         Also show how many tickets each one bought. ---
        for (let i = 0; i < buyers.length; i++) {
            const bal = await connection.getBalance(buyers[i].publicKey);
            const count = purchases.filter((p) => p === buyers[i]).length;
            const tag = buyers[i] === winner ? "  <- winner" : "";
            console.log(
                `balance[${i}]:`,
                bal / LAMPORTS_PER_SOL,
                "SOL",
                `(${count} ticket(s))`,
                tag
            );
        }
        console.log("vault     :", (await connection.getBalance(vault)) /
            LAMPORTS_PER_SOL, "SOL");
    });
});