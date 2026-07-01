"use client";

// Live activity feed for the Hero's right column.
// Uses the AnimatedList primitive to reveal lottery events (ticket buys + wins)
// as a stack of notifications, newest on top.
//
// Portfolio project on devnet: the data below is intentionally fabricated —
// there is no real traffic on devnet, so we simulate a lively feed. Later this
// can be fed from the indexer (phase 9: TicketBought / WinnerDrawn in Postgres).
import { AnimatedList } from "@/components/ui/animated-list";
import Jazzicon from "react-jazzicon";

type Activity = {
  id: number;
  kind: "win" | "buy";
  addr: string;
  amount: number; // SOL won (win) or ticket count (buy)
  round: number;
  ago: string;
};

// Real on-chain ticket price. Buys contribute tickets * TICKET_PRICE to the pot.
const TICKET_PRICE = 0.5;
const sol = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

// Deterministic seed for jazzicon. Our mock addresses aren't valid hex, so the
// package's jsNumberForAddress would yield NaN — we hash the whole string
// instead so each address always maps to the same unique icon.
function seedFromAddr(addr: string): number {
  let h = 0;
  for (let i = 0; i < addr.length; i++) {
    h = (h * 31 + addr.charCodeAt(i)) >>> 0; // keep it an unsigned 32-bit int
  }
  return h;
}

// Fake but plausible stream, most recent last (AnimatedList reveals in order).
// For "buy" rows, `amount` is the number of tickets; for "win" rows it's the
// pot in SOL (a realistic multiple of TICKET_PRICE, not thousands).
const activity: Activity[] = [
  { id: 1, kind: "buy", addr: "Ck8v…qA3n", amount: 2, round: 248, ago: "5m" },
  { id: 2, kind: "win", addr: "7xKq…9fPa", amount: 42.5, round: 247, ago: "2h" },
  { id: 3, kind: "buy", addr: "9pLd…2vXo", amount: 5, round: 248, ago: "8m" },
  { id: 4, kind: "buy", addr: "Bv2m…hLZ4", amount: 1, round: 248, ago: "12m" },
  { id: 5, kind: "win", addr: "3nRe…kQ8w", amount: 27.5, round: 246, ago: "6h" },
  { id: 6, kind: "buy", addr: "Ht4c…mZ7y", amount: 3, round: 248, ago: "15m" },
  { id: 7, kind: "win", addr: "Rp5t…Wq2b", amount: 18, round: 245, ago: "11h" },
  { id: 8, kind: "buy", addr: "Kf9n…Lm4d", amount: 8, round: 248, ago: "20m" },
  { id: 9, kind: "buy", addr: "Zx3w…Pv7k", amount: 1, round: 248, ago: "22m" },
  { id: 10, kind: "win", addr: "Nb6y…Tc8r", amount: 33, round: 244, ago: "1d" },
];

function ActivityCard({ kind, addr, amount, round, ago }: Activity) {
  const isWin = kind === "win";
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-border bg-background/70 p-3 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:border-primary/40">
      <div className="flex items-center gap-3">
        {/* Jazzicon identicon derived from the address (MetaMask-style) */}
        <span className="flex size-10 flex-shrink-0 overflow-hidden rounded-full">
          <Jazzicon diameter={40} seed={seedFromAddr(addr)} />
        </span>

        <div className="min-w-0 flex-1">
          <h5 className="truncate text-sm font-semibold text-foreground">
            {isWin ? (
              <>
                <span className="font-mono">{addr}</span> won the pot
              </>
            ) : (
              <>
                <span className="font-mono">{addr}</span> bought {amount}{" "}
                {amount > 1 ? "tickets" : "ticket"}
              </>
            )}
          </h5>
          <p className="truncate text-xs text-muted-foreground">
            Round #{round} · {ago}
          </p>
        </div>

        {/* Right value in SOL: the pot won (green) or the stake added to it */}
        <div className="text-right">
          <div
            className={`text-sm font-semibold ${isWin ? "text-success" : "text-foreground"}`}
          >
            +{sol(isWin ? amount : amount * TICKET_PRICE)} SOL
          </div>
          <div className="text-[10px] text-muted-foreground">
            {isWin ? "Paid on-chain" : "to the pot"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveActivity() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Soft brand glow behind the panel */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative rounded-2xl border border-border bg-card/90 p-5 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Live activity
          </div>
          <span className="text-xs text-muted-foreground">Round #248</span>
        </div>

        {/* Animated feed (fixed height, older items fade under the gradient) */}
        <div className="relative mt-4 h-80 overflow-hidden">
          <AnimatedList delay={1200} maxVisible={5} className="gap-3">
            {activity.map((a) => (
              <ActivityCard key={a.id} {...a} />
            ))}
          </AnimatedList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>Updated in real time</span>
          <a href="#lotteries" className="font-medium text-foreground hover:underline">
            View all →
          </a>
        </div>
      </div>
    </div>
  );
}
