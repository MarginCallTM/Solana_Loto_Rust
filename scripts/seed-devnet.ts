// Seed devnet with one full lottery cycle, so the indexer (Phase 9.3) has
// real on-chain events to fetch and decode:
//   initializeLottery -> LotteryInitialized
//   buyTicket   (x2)  -> TicketBought (x2)
//   drawWinner        -> WinnerDrawn
//   payout            -> PrizeClaimed
//
// Run (same runner as the smoke test):
//   yarn run ts-mocha -p ./tsconfig.json -t 1000000 "scripts/seed-devnet.ts"

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";

describe("seed devnet", () => {
    it("runs a full lottery cycle and emits all 4 events", async () => {
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

        // --- 2. A fresh round id every run: the Lottery PDA is seeded by round_id,
        //          so reusing one would fail with "account already in use" ---
        const roundId = new anchor.BN(Math.floor(Date.now() / 1000));
        const ticketPrice = new anchor.BN(0.001 * LAMPORTS_PER_SOL);
        const duration = new anchor.BN(30); // seconds; long enough for init + 2 buys

        const roundBytes = roundId.toArrayLike(Buffer, "le", 8);
        const [lottery] = PublicKey.findProgramAddressSync(
            [Buffer.from("lottery"), roundBytes],
            program.programId
        );
        const [vault] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), roundBytes],
            program.programId
        );
        const ticketPda = (index: number) => PublicKey.findProgramAddressSync(
            [
                Buffer.from("ticket"),
                roundBytes,
                new anchor.BN(index).toArrayLike(Buffer, "le", 8),
            ],
            program.programId
        )[0];

        const explorer = (sig: string) =>
            `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

        console.log("Round id: ", roundId.toString());
        console.log("Lottery :", lottery.toBase58());

        // --- 3. initialize_lottery -> LotteryInitialized ---
        let sig = await program.methods
            .initializeLottery(roundId, ticketPrice, duration)
            .accounts({
                lottery,
                vault,
                authority: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        console.log("init  :", explorer(sig));

        // --- 4. buy_ticket x2 -> TicketBought x2 ---
        for (let i = 0; i < 2; i++) {
            sig = await program.methods
                .buyTicket()
                .accounts({
                    lottery,
                    vault,
                    ticket: ticketPda(i),
                    buyer: wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();
            console.log(`buy[${i}]  :`, explorer(sig));
        }

        // --- 5. Wait for the on-chain clock to pass end_timestamp (real devnet time) ---
        const deadline = (
            await program.account.lottery.fetch(lottery)
        ).endTimestamp.toNumber();
        for (;;) {
            const slot = await connection.getSlot();
            const t = await connection.getBlockTime(slot);
            if (t !== null && t > deadline) break;
            await new Promise((r) => setTimeout(r, 1000));
        }

        // --- 6. draw_winner -> WinnerDrawn ---
        sig = await program.methods
            .drawWinner()
            .accounts({lottery, authority: wallet.publicKey})
            .rpc();
        console.log("draw  :", explorer(sig));

        // --- 7. payout -> PrizeClaimed (winner == buyer == provier wallet) ---
        const draw = await program.account.lottery.fetch(lottery);
        const winningTicket = ticketPda(draw.winnerIndex.toNumber());
        sig = await program.methods
            .payout()
            .accounts({
                lottery,
                vault,
                ticket: winningTicket,
                winner: wallet.publicKey,
                payer: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        console.log("payout  :", explorer(sig));
    });
});