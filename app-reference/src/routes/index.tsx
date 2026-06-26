import { createFileRoute } from "@tanstack/react-router";
import treasureHero from "@/assets/treasure-hero.png";
import solCoin from "@/assets/sol-coins.png";
import miniChest from "@/assets/mini-chest.png";
import cloud from "@/assets/cloud.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solvault — The On-Chain Lottery on Solana" },
      { name: "description", content: "Provably fair lottery on Solana. Buy a ticket, win the vault. Transparent, secure, instant payouts." },
      { property: "og:title", content: "Solvault — The On-Chain Lottery on Solana" },
      { property: "og:description", content: "Provably fair lottery on Solana. Buy a ticket, win the vault. Transparent, secure, instant payouts." },
    ],
  }),
  component: Index,
});

const tickerItems = [
  { name: "7xKq…9fPa", action: "bought", value: "12 tickets", tone: "buy" },
  { name: "Round #248", action: "closes in", value: "04h 21m", tone: "info" },
  { name: "Bv2m…hLZ4", action: "won", value: "184 SOL", tone: "win" },
  { name: "3,418 tickets in this vault", action: "", value: "", tone: "info" },
  { name: "9qRn…pT1c", action: "bought", value: "3 tickets", tone: "buy" },
  { name: "Last draw paid", action: "in", value: "1.4s", tone: "info" },
  { name: "Ej4z…aM77", action: "won", value: "42 SOL", tone: "win" },
  { name: "Fk8w…vQ2s", action: "bought", value: "1 ticket", tone: "buy" },
];

function Ticker() {
  const items = [...tickerItems, ...tickerItems];
  return (
    <div className="w-full overflow-hidden border-b border-border bg-card/60 backdrop-blur">
      <div className="ticker-track flex gap-2 whitespace-nowrap py-2 text-xs">
        {items.map((it, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 ${
              it.tone === "win"
                ? "bg-[oklch(0.96_0.06_165)] text-[oklch(0.35_0.15_160)]"
                : it.tone === "info"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-card text-foreground"
            }`}
          >
            <span className="size-1.5 rounded-full bg-[var(--gradient-brand)]" style={{ background: "var(--gradient-brand)" }} />
            <span className="font-medium">{it.name}</span>
            {it.action && <span className="text-muted-foreground">{it.action}</span>}
            {it.value && <span className="font-semibold tabular-nums">{it.value}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <a href="/" className="flex items-center gap-2">
          <span
            className="grid size-8 place-items-center rounded-xl text-primary-foreground font-display text-sm"
            style={{ background: "var(--gradient-brand)" }}
          >S</span>
          <span className="font-display text-lg tracking-tight">Solvault</span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {["Lotteries", "How it works", "Winners", "Docs"].map((l) => (
            <a key={l} href="#" className="rounded-full px-3.5 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="#" className="hidden rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary sm:inline-flex">
            View lottery
          </a>
          <a href="#play" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground cta-glow" style={{ background: "var(--gradient-brand)" }}>
            <span className="size-1.5 rounded-full bg-white/90" /> Connect wallet
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="play"
      className="relative overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-24 md:grid-cols-2 md:pt-24 md:pb-32">
        <div className="relative z-10 text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-success" /> Live on Solana mainnet · Round #248
          </span>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-tight">
            The on-chain<br />
            <span className="brand-text">treasure hunt</span><br />on Solana.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Buy a ticket, join the vault. Every draw is provably fair, settled on-chain, and paid out in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#play"
              className="inline-flex items-center gap-3 rounded-full px-7 py-4 text-base font-semibold text-primary-foreground cta-glow transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-brand)" }}
            >
              Buy ticket
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">0.1 SOL</span>
            </a>
            <a
              href="#lotteries"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-base font-medium hover:bg-secondary"
            >
              View lottery →
            </a>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              { k: "12,438 SOL", v: "Current vault" },
              { k: "3,418", v: "Players" },
              { k: "100%", v: "On-chain" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-xl tabular-nums">{s.k}</dt>
                <dd className="mt-0.5 text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto flex h-[420px] w-full max-w-md items-center justify-center md:h-[520px]">
          <div
            className="absolute inset-8 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, oklch(0.78 0.18 295 / 0.5), transparent 70%)" }}
          />
          <img
            src={treasureHero}
            alt="Treasure chest with Solana coins"
            width={520}
            height={520}
            className="relative z-10 w-full max-w-[460px] drop-shadow-2xl float-y"
          />
          <img src={cloud} alt="" aria-hidden width={120} height={120} loading="lazy" className="absolute -left-4 bottom-10 w-24 opacity-80 float-slow" />
          <img src={cloud} alt="" aria-hidden width={120} height={120} loading="lazy" className="absolute -right-2 top-12 w-20 opacity-70 float-med" style={{ animationDelay: "1s" }} />
          <img src={solCoin} alt="" aria-hidden width={80} height={80} loading="lazy" className="absolute right-6 bottom-16 w-14 float-fast" />
          <img src={solCoin} alt="" aria-hidden width={80} height={80} loading="lazy" className="absolute left-2 top-24 w-10 opacity-80 float-med" style={{ animationDelay: "0.5s" }} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-widest">Secured by</span>
          <span className="font-display">◆ Solana</span>
          <span className="font-display">⬢ Anchor</span>
          <span className="font-display">⟁ Switchboard VRF</span>
          <span className="font-display">◆ Phantom</span>
          <span className="font-display">⟡ Backpack</span>
        </div>
      </div>
    </section>
  );
}

function Lotteries() {
  const items = [
    { tag: "Daily", name: "Sunrise Vault", pot: "1,284 SOL", price: "0.05 SOL", players: "842", closes: "04h 21m", featured: false },
    { tag: "Weekly", name: "Grand Treasury", pot: "12,438 SOL", price: "0.1 SOL", players: "3,418", closes: "2d 11h", featured: true },
    { tag: "Monthly", name: "Diamond Hoard", pot: "48,210 SOL", price: "0.25 SOL", players: "9,107", closes: "14d 02h", featured: false },
  ];
  return (
    <section id="lotteries" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Active vaults</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Pick a vault. Buy a ticket.</h2>
          </div>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">View all rounds →</a>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {items.map((it) => (
            <article
              key={it.name}
              className={`relative overflow-hidden rounded-3xl border bg-card p-6 card-soft ${
                it.featured ? "border-primary/30 ring-1 ring-primary/15" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {it.tag}
                </span>
                {it.featured && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
                    Featured
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <img src={it.featured ? treasureHero : miniChest} alt="" width={96} height={96} loading="lazy" className="size-20 object-contain float-y" />
                <div>
                  <h3 className="font-display text-xl">{it.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Closes in {it.closes}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current vault</p>
                <p className="mt-1 font-display text-4xl tabular-nums brand-text">{it.pot}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/60 p-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Ticket</p>
                  <p className="font-semibold tabular-nums">{it.price}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Players</p>
                  <p className="font-semibold tabular-nums">{it.players}</p>
                </div>
              </div>

              <button
                className="mt-5 w-full rounded-full px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
                style={{ background: it.featured ? "var(--gradient-brand)" : "oklch(0.18 0.02 280)" }}
              >
                Buy ticket
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Connect your wallet", d: "Phantom, Backpack, Solflare — secure, non-custodial connection in one click." },
    { n: "02", t: "Buy a ticket", d: "Choose a vault, sign the transaction. Every ticket is recorded on Solana." },
    { n: "03", t: "Win the vault", d: "Draws are settled by Switchboard VRF. Winners are paid out automatically, in seconds." },
  ];
  return (
    <section id="how" className="relative overflow-hidden bg-secondary/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">Transparent by design. Built on Solana.</h2>
          <p className="mt-4 text-muted-foreground">Three steps. No accounts, no custodians, no hidden fees. The vault opens automatically when the draw closes.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-7 card-soft">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary font-display text-sm text-primary">{s.n}</span>
                <h3 className="font-display text-lg">{s.t}</h3>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { k: "284,910 SOL", v: "Paid to winners" },
    { k: "1.2s", v: "Avg. payout time" },
    { k: "62,401", v: "Tickets this week" },
    { k: "100%", v: "On-chain & audited" },
  ];
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k} className="bg-card p-8">
              <div className="font-display text-3xl tabular-nums">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { t: "Non-custodial", d: "Funds never leave the on-chain vault until the draw settles. You sign every transaction." },
    { t: "Provably random", d: "Winners are drawn with Switchboard VRF. Anyone can verify the result on-chain." },
    { t: "Instant payouts", d: "Smart contracts release the vault directly to the winner's wallet — usually under 2 seconds." },
  ];
  return (
    <section className="bg-background py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="relative flex justify-center">
          <img src={miniChest} alt="" width={420} height={420} loading="lazy" className="w-72 float-y drop-shadow-xl md:w-80" />
          <img src={solCoin} alt="" width={80} height={80} loading="lazy" className="absolute right-4 top-4 w-14 float-fast" />
          <img src={cloud} alt="" width={120} height={120} loading="lazy" className="absolute -bottom-2 left-2 w-24 opacity-80" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">Why Solvault</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">A lottery you can actually audit.</h2>
          <ul className="mt-8 space-y-5">
            {items.map((it) => (
              <li key={it.t} className="flex gap-4">
                <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>✓</span>
                <div>
                  <h3 className="font-display text-lg">{it.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24 text-center" style={{ background: "var(--gradient-hero)" }}>
      <img src={cloud} alt="" aria-hidden width={160} height={160} className="absolute left-8 top-10 w-28 opacity-70 float-slow" />
      <img src={cloud} alt="" aria-hidden width={160} height={160} className="absolute right-10 bottom-8 w-32 opacity-60 float-med" />
      <div className="relative mx-auto max-w-2xl px-6">
        <img src={treasureHero} alt="" width={260} height={260} loading="lazy" className="mx-auto w-44 float-y drop-shadow-2xl" />
        <h2 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight">
          The next vault is <span className="brand-text">opening soon.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">Connect your wallet and grab a ticket in under a minute.</p>
        <a
          href="#play"
          className="mt-8 inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-primary-foreground cta-glow hover:scale-[1.02]"
          style={{ background: "var(--gradient-brand)" }}
        >
          Buy ticket
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">0.1 SOL</span>
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg text-primary-foreground font-display text-xs" style={{ background: "var(--gradient-brand)" }}>S</span>
          <span className="font-display text-foreground">Solvault</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Docs</a>
          <a href="#" className="hover:text-foreground">Smart contract</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Responsible play</a>
        </div>
        <span>© {new Date().getFullYear()} Solvault · Built on Solana</span>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Ticker />
      <Header />
      <main>
        <Hero />
        <Lotteries />
        <HowItWorks />
        <Trust />
        <Stats />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
