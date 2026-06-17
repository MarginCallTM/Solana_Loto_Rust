import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";

describe("lottery", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.lottery as Program<Lottery>;

  it("pings the program", async () => {
    const tx = await program.methods.ping().rpc();
    console.log("ping tx signature", tx);
  });
});
