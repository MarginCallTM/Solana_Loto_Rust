// Hero section — ported from the Lovable maquette (main block).
// Stateless + only static images -> Server Component (no "use client").
// Images live in /public and are referenced with plain <img> to match the
// maquette 1:1 (next/image could alter layout/aspect; fidelity first).
//
// TODO(10.16): the badge text "Solana mainnet · Round #248" is a mock kept for
// pixel-parity. It MUST be corrected to devnet + a single real round.
import { PoweredBySparkles } from "@/components/site/powered-by-sparkles";
import { LiveActivity } from "@/components/site/live-activity";

export function Hero() {
  return (
    <section
      id="play"
      className="relative overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Floating cute cloud — top left */}
      <div className="pointer-events-none absolute left-6 top-10 w-[11.7rem] md:w-[14.3rem] lg:w-[16.9rem]">
        <img
          src="/cloud-cute.png"
          alt=""
          aria-hidden
          className="w-full drop-shadow-xl"
          style={{ animation: "float-y 6s ease-in-out infinite" }}
        />
        <span
          aria-hidden
          className="float-shadow"
          style={{ animation: "shadow-pulse 6s ease-in-out infinite" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-16 md:pt-36">
        {/* Floating candy — top-right of the headline block */}
        <div className="pointer-events-none absolute right-2 top-6 z-10 w-16 sm:right-6 sm:w-20 md:w-24 lg:right-8 lg:w-28">
          <img
            src="/solana-hero.png"
            alt=""
            aria-hidden
            className="w-full"
            style={{ animation: "candy-wobble 5s ease-in-out infinite" }}
          />
          <span
            aria-hidden
            className="float-shadow float-shadow--sm"
            style={{ animation: "shadow-pulse 5s ease-in-out infinite" }}
          />
        </div>

        {/* Headline block — kept centered above the two-column showcase */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur animate-fade-in">
            <span className="size-1.5 rounded-full bg-success" /> Live on Solana mainnet · Round #248
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight animate-fade-in lg:whitespace-nowrap">
            The Lottery on <span className="brand-text">Solana</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-fade-in">
            Buy a ticket, join the vault. Every draw is provably fair, settled on-chain, and paid out in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
            <a
              href="#play"
              className="inline-flex items-center gap-3 rounded-full px-7 py-4 text-base font-semibold text-primary-foreground cta-glow transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-brand)" }}
            >
              Buy ticket
            </a>
            <a
              href="#lotteries"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-base font-medium hover:bg-secondary"
            >
              View lottery
            </a>
          </div>
        </div>

        {/* Two-column showcase: smaller chest (left) + live leaderboard (right).
            Stacks vertically on mobile, side-by-side from lg. */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
          {/* Treasure chest — reduced and left-aligned on desktop (+15% width) */}
          <div className="relative mx-auto w-full max-w-[27.6rem] lg:mx-0">
            <div
              className="absolute inset-x-8 bottom-0 h-20 rounded-full opacity-70 blur-3xl"
              style={{ background: "radial-gradient(circle, oklch(0.78 0.18 259.81 / 0.5), transparent 70%)" }}
            />
            <img
              src="/chest-wallpaper.png"
              alt="Treasure chest with Solana coins"
              className="relative z-10 mx-auto w-full drop-shadow-2xl"
              style={{ animation: "float-y 5s ease-in-out infinite" }}
            />
          </div>

          {/* Live activity feed (fabricated devnet data — see component header) */}
          <LiveActivity />
        </div>
      </div>

      {/* Design test: sparkles logo cloud instead of the marquee (revertible). */}
      <PoweredBySparkles />
    </section>
  );
}
