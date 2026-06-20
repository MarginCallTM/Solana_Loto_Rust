// Smoke test: Prove the deployed program EXECUTES on devnet (not just loads)
// We call the cheapest instruction ('ping') against the live devnet program.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import * as fs from "fs";
import * as os from "os";

describe("smoke devnet", () => {
    it("pings the oive program on devnet", async () => {
        // 1. Connection to the public devnet RPC.
        const connection = new anchor.web3.Connection(
           "https://api.devnet.solana.com",
            "confirmed" 
        );

        // 2. Load the local dev wallet (the same one that paid for the deploy)
        const secret = JSON.parse(
            fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")
        );
        const keypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(secret));
        const wallet = new anchor.Wallet(keypair);

        // 3. Build the provider and make it the default one for .rpc() calls.
        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });
        anchor.setProvider(provider);

        // 4. Load the IDL. In Anchir 0.31 the program id lives in the IDL 'address' field,
        //      so the constructor no longer takes the program id separately.
        const idl = JSON.parse(fs.readFileSync("./target/idl/lottery.json", "utf8"));
        const program = new Program<Lottery>(idl as Lottery, provider);

        console.log("Program id:", program.programId.toBase58());
        console.log("Payer     :", wallet.publicKey.toBase58());

        // 5. Send the ping instruction (no accounts required) and wait for confirmation.
        const sig = await program.methods.ping().rpc();

        console.log("ping OK, signature", sig);
        console.log(
            "Explorer :",
            `https://explorer.solana.com/tx/${sig}?cluster=devnet`
        );
    });
});