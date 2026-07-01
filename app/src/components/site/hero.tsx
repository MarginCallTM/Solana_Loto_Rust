// Hero section — ported from the Lovable maquette (main block).
// Stateless + only static images -> Server Component (no "use client").
// Images live in /public and are referenced with plain <img> to match the
// maquette 1:1 (next/image could alter layout/aspect; fidelity first).
//
// TODO(10.16): the badge text "Solana mainnet · Round #248" is a mock kept for
// pixel-parity. It MUST be corrected to devnet + a single real round.
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

      {/* Floating candy — right side */}
      <div className="pointer-events-none absolute right-4 top-32 w-20 sm:right-6 sm:top-1/3 sm:w-24 md:w-28 lg:w-36">
        <img
          src="/candy.png"
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

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-28 pb-16 text-center md:pt-36">
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

        {/* Treasure chest hero image */}
        <div className="relative mt-14 w-full max-w-xl">
          <div
            className="absolute inset-x-8 bottom-0 h-24 rounded-full opacity-70 blur-3xl"
            style={{ background: "radial-gradient(circle, oklch(0.78 0.18 259.81 / 0.5), transparent 70%)" }}
          />
          <img
            src="/chest-wallpaper.png"
            alt="Treasure chest with Solana coins"
            className="relative z-10 mx-auto w-full drop-shadow-2xl"
            style={{ animation: "float-y 5s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* "Powered by" logo marquee */}
      <div className="border-t border-border/60 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-5 text-sm text-muted-foreground">
          <span className="shrink-0 text-xs uppercase tracking-widest">Powered by</span>
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="marquee-track flex w-max whitespace-nowrap">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex shrink-0 items-center">
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src="/solana.png" alt="Solana" className="size-5" />
                    Solana
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src="/phantom.png" alt="Phantom" className="size-5 rounded-md" />
                    Phantom
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src="/backpack.jpeg" alt="Backpack" className="size-5 rounded-md" />
                    Backpack
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src="/jupiter.png" alt="Jupiter" className="size-5 rounded-md" />
                    Jupiter
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src="/superteam.svg" alt="Superteam" className="size-5" />
                    Superteam
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src="/solflare.svg" alt="Solflare" className="size-5 rounded-md" />
                    Solflare
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
