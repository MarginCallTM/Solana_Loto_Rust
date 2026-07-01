import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import treasureHero from "@/assets/treasure-hero.png";
import solCoin from "@/assets/sol-coins.png";
import miniChest from "@/assets/mini-chest.png";
import cloud from "@/assets/cloud.png";
import solanaCoin3d from "@/assets/solana-coin-3d.png.asset.json";
import candy from "@/assets/candy.png.asset.json";
import cloudCute from "@/assets/cloud-cute.png.asset.json";
import cottonCandy2 from "@/assets/coton-candy-2.png.asset.json";
import solanaCoinDark from "@/assets/solana-coin-dark.png.asset.json";
import solanaCoinLeft from "@/assets/solana-coin-left.png.asset.json";
import solanaCoinRight from "@/assets/solana-coin-right.png.asset.json";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import chestFrame1 from "@/assets/chest-frame-1.png.asset.json";
import chestFrame2 from "@/assets/chest-frame-2.png.asset.json";
import chestFrame3 from "@/assets/chest-frame-3.png.asset.json";
import chestFrame4 from "@/assets/chest-frame-4.png.asset.json";
import chestFrame5 from "@/assets/chest-frame-5.png.asset.json";
import chestFrame6 from "@/assets/chest-frame-6.png.asset.json";
import chestFrame7 from "@/assets/chest-frame-7.png.asset.json";
import chestFrame8 from "@/assets/chest-frame-8.png.asset.json";
import chestFrame9 from "@/assets/chest-frame-9.png.asset.json";
import treasureChest from "@/assets/chest-wallpaper.png.asset.json";
import purpleChest from "@/assets/purple-chest.png.asset.json";
import mysteriousChest from "@/assets/mysterious-chest-purple.png.asset.json";
import phantomIcon from "@/assets/phantom-icon.png.asset.json";
import jupiterIcon from "@/assets/jupiter-icon.png.asset.json";
import superteamIcon from "@/assets/superteam-icon.avif.asset.json";
import superteamFooter from "@/assets/superteam-footer.svg.asset.json";
import solanaLogo from "@/assets/solana-logo-v2.png.asset.json";
import backpackIcon from "@/assets/backpack-icon.jpeg.asset.json";
import solflareIcon from "@/assets/solflare-icon.svg.asset.json";

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

const chestOpenFrames = [
  chestFrame1.url,
  chestFrame2.url,
  chestFrame3.url,
  chestFrame4.url,
  chestFrame5.url,
  chestFrame6.url,
  chestFrame7.url,
];

const chestFullOpenFrames = [
  chestFrame1.url,
  chestFrame2.url,
  chestFrame3.url,
  chestFrame4.url,
  chestFrame5.url,
  chestFrame6.url,
  chestFrame7.url,
  chestFrame8.url,
  chestFrame9.url,
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
      {/* Floating cute cloud — top left */}
      <div className="pointer-events-none absolute left-6 top-10 w-[11.7rem] md:w-[14.3rem] lg:w-[16.9rem]">
        <img
          src={cloudCute.url}
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
          src={candy.url}
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
            style={{ background: "radial-gradient(circle, oklch(0.78 0.18 295 / 0.5), transparent 70%)" }}
          />
          <img
            src={treasureChest.url}
            alt="Treasure chest with Solana coins"
            className="relative z-10 mx-auto w-full drop-shadow-2xl"
            style={{ animation: "float-y 5s ease-in-out infinite" }}
          />
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-5 text-sm text-muted-foreground">
          <span className="shrink-0 text-xs uppercase tracking-widest">Powered by</span>
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="marquee-track flex w-max whitespace-nowrap">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex shrink-0 items-center">
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src={solanaLogo.url} alt="Solana" className="size-5" />
                    Solana
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src={phantomIcon.url} alt="Phantom" className="size-5 rounded-md" />
                    Phantom
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src={backpackIcon.url} alt="Backpack" className="size-5 rounded-md" />
                    Backpack
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src={jupiterIcon.url} alt="Jupiter" className="size-5 rounded-md" />
                    Jupiter
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src={superteamFooter.url} alt="Superteam" className="size-5" />
                    Superteam
                  </span>
                  <span className="inline-flex w-40 shrink-0 items-center justify-center gap-2 font-display">
                    <img src={solflareIcon.url} alt="Solflare" className="size-5 rounded-md" />
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

function Lotteries() {
  const items = [
    { tag: "Daily", name: "Sunrise Vault", pot: "1,284 SOL", price: "0.05 SOL", players: "842", closes: "04h 21m", featured: false, comingSoon: false, image: purpleChest.url },
    { tag: "Weekly", name: "Grand Treasury", pot: "12,438 SOL", price: "0.1 SOL", players: "3,418", closes: "2d 11h", featured: true, comingSoon: true, image: treasureChest.url },
    { tag: "Monthly", name: "Diamond Hoard", pot: "48,210 SOL", price: "0.25 SOL", players: "9,107", closes: "14d 02h", featured: false, comingSoon: true, image: mysteriousChest.url },
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
                {it.comingSoon ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-amber-500" /> Coming soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <img src={it.image} alt="" width={96} height={96} loading="lazy" className="size-20 object-contain float-y" />
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
                disabled={it.comingSoon}
                className={`mt-5 w-full rounded-full px-4 py-3 text-sm font-semibold transition-transform ${
                  it.comingSoon
                    ? "cursor-not-allowed bg-secondary text-muted-foreground"
                    : "text-primary-foreground hover:scale-[1.01]"
                }`}
                style={
                  it.comingSoon
                    ? undefined
                    : { background: it.featured ? "var(--gradient-brand)" : "oklch(0.18 0.02 280)" }
                }
              >
                {it.comingSoon ? "Coming soon" : "Buy ticket"}
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
  const [shakeCount, setShakeCount] = useState(0);
  const [openFrame, setOpenFrame] = useState<number | null>(null);
  const openTimer = useRef<number | null>(null);

  const triggerShake = () => {
    if (openFrame !== null) return;
    setShakeCount((c) => {
      const next = c + 1;
      if (next >= 9) {
        setOpenFrame(0);
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (openFrame === null) return;
    if (openFrame >= chestFullOpenFrames.length - 1) return;
    openTimer.current = window.setTimeout(() => {
      setOpenFrame((f) => (f === null ? null : f + 1));
    }, 110);
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
    };
  }, [openFrame]);

  const isOpening = openFrame !== null;
  const currentSrc = isOpening ? chestFullOpenFrames[openFrame!] : chestOpenFrames[0];

  const handleClick = () => {
    if (isOpening && openFrame === chestFullOpenFrames.length - 1) {
      setOpenFrame(null);
      setShakeCount(0);
      return;
    }
    triggerShake();
  };
  return (
    <section className="bg-background py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={handleClick}
            aria-label="Shake the treasure chest"
            className="relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full select-none touch-none"
          >
            <img
              key={isOpening ? `open-${openFrame}` : `shake-${shakeCount}`}
              src={currentSrc}
              alt="Treasure chest"
              width={420}
              height={420}
              loading="lazy"
              className={`w-72 drop-shadow-xl md:w-80 cursor-pointer will-change-transform ${isOpening ? "" : shakeCount > 0 ? "chest-shake-once" : "float-y transition-transform duration-300 hover:scale-105"}`}
            />
            {isOpening && openFrame === chestFullOpenFrames.length - 1 && (
              <span className="chest-burst pointer-events-none absolute inset-0" />
            )}
          </button>
          <img src={solanaCoinRight.url} alt="" width={160} height={160} loading="lazy" className="absolute right-2 top-2 w-20 float-fast drop-shadow-xl" />
          <img src={solanaCoinLeft.url} alt="" width={200} height={200} loading="lazy" className="absolute -bottom-6 -left-2 w-[7.35rem] float-slow drop-shadow-xl" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">Why Solvault</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">A lottery you can actually audit.</h2>
          <ul className="mt-8 space-y-5">
            {items.map((it) => (
              <li key={it.t} className="flex gap-4">
                <span className="mt-1.5 grid size-4 shrink-0 place-items-center rounded-full border border-primary/40 text-primary text-[10px]">✓</span>
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
    <section id="faq" className="relative overflow-hidden py-24" style={{ background: "var(--gradient-hero)" }}>
      <img src={cloud} alt="" aria-hidden width={120} height={120} className="absolute left-8 top-10 w-24 opacity-80 float-slow" />
      <img src={cloud} alt="" aria-hidden width={160} height={160} className="absolute right-10 bottom-8 w-32 opacity-60 float-med" />
      <div className="relative mx-auto max-w-6xl px-6 grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            FAQ
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] leading-tight">
            Questions, <span className="brand-text">answered.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-sm">
            Everything you need to know about playing the Solana lottery on Solvault.
          </p>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-background/70 px-5 backdrop-blur transition-colors hover:bg-background/90"
            >
              <AccordionTrigger className="py-5 text-left font-display text-base md:text-lg hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How do I enter the lottery?",
    a: "Connect your Solana wallet, choose a vault, and buy a ticket in SOL. Each ticket is an on-chain entry for that round's draw.",
  },
  {
    q: "What are the prizes and odds?",
    a: "Every vault shows its live prize pool and total tickets in real time. Your odds equal your tickets divided by the total tickets sold in that round.",
  },
  {
    q: "How do I receive my winnings?",
    a: "Winnings are paid out automatically to the winner's wallet on-chain at the end of each round — no claim form, no waiting.",
  },
  {
    q: "How do I know this is fair?",
    a: "Draws are powered by Switchboard VRF on Solana. Every random number is verifiable on-chain, so no one — not even us — can influence the outcome.",
  },
  {
    q: "How is this different from traditional lotteries?",
    a: "No middlemen, no opaque accounting. Tickets, prize pool, and winner selection all live on Solana and can be audited by anyone, anytime.",
  },
  {
    q: "How do referrals work?",
    a: "Share your referral link to earn a percentage of every ticket your friends buy, credited directly to your wallet.",
  },
];

function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-12">
        {/* Brand column */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-xl text-primary-foreground font-display text-sm"
              style={{ background: "var(--gradient-brand)" }}
            >S</span>
            <span className="font-display text-lg tracking-tight text-foreground">Solvault</span>
          </div>
          <p className="mt-5 font-display text-base text-foreground">
            Play the on-chain lottery on Solana.
          </p>

          <div className="mt-16 flex items-center gap-3">
            {["telegram", "x", "discord"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="grid size-9 place-items-center rounded-full bg-secondary text-foreground/70 hover:bg-secondary/70 hover:text-foreground transition"
              >
                {s === "telegram" && (
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M9.78 15.27 9.6 19a.6.6 0 0 0 1 .44l2.18-2.1 4.52 3.31c.83.46 1.42.22 1.63-.77l2.96-13.86c.27-1.23-.45-1.71-1.25-1.41L3.3 10.34c-1.2.48-1.19 1.16-.22 1.47l4.4 1.37 10.2-6.43c.48-.31.92-.14.56.17"/></svg>
                )}
                {s === "x" && (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M18.244 2H21l-6.52 7.45L22 22h-6.84l-4.79-6.27L4.8 22H2l7-8L2 2h6.91l4.34 5.74L18.244 2Zm-1.2 18h1.86L7.04 4H5.1l11.944 16Z"/></svg>
                )}
                {s === "discord" && (
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.074.035c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.65 12.65 0 0 0-.617-1.25.07.07 0 0 0-.073-.035A19.74 19.74 0 0 0 3.677 4.37a.06.06 0 0 0-.03.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .03.056 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.027 14.2 14.2 0 0 0 1.226-1.994.07.07 0 0 0-.04-.1 13.1 13.1 0 0 1-1.872-.892.07.07 0 0 1-.008-.117c.126-.094.252-.192.372-.291a.07.07 0 0 1 .074-.01c3.927 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .075.009c.12.1.246.198.373.292a.07.07 0 0 1-.006.117 12.3 12.3 0 0 1-1.873.891.07.07 0 0 0-.04.101 15.9 15.9 0 0 0 1.225 1.993.08.08 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.08.08 0 0 0 .03-.055c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.03-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.42 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.335-.956 2.42-2.157 2.42Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.335-.946 2.42-2.157 2.42Z"/></svg>
                )}
              </a>
            ))}
          </div>

          <p className="mt-6 max-w-md text-xs leading-relaxed text-muted-foreground">
            Solvault is a decentralized lottery protocol on Solana. All draws are settled on-chain
            using Switchboard VRF and paid out automatically through audited smart contracts.
            Players must comply with the laws of their jurisdiction. Play responsibly.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
          <div className="space-y-4 text-sm">
            {["Audits", "Blog", "Docs", "Developers", "Ecosystem", "About"].map((l) => (
              <a key={l} href="#" className="block font-medium text-foreground/80 hover:text-foreground">{l}</a>
            ))}
          </div>
          <div className="space-y-4 text-sm">
            {["Results", "Privacy", "Terms", "Responsible play"].map((l) => (
              <a key={l} href="#" className="block font-medium text-foreground/80 hover:text-foreground">{l}</a>
            ))}
          </div>
          <div className="space-y-4 text-sm">
            <a href="#" className="block font-medium text-foreground/80 hover:text-foreground">Contact support</a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-border px-6 pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Solvault · Built on Solana
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
