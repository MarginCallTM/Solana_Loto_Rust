export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Live on Solana devnet
        </span>

        <h1 className="mt-5 font-display text-5xl leading-tight">
          The on-chain <span className="brand-text">treasure hunt</span>.
        </h1>

        <p className="mt-4 text-muted-foreground">
        Buy a ticket, join the vault. Every draw is provably fair, settled on-chain, and paid out in seconds.
        </p>

        <button
          className="mt-8 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground cta-glow"
          style={{ background: "var(--gradient-brand)" }}
        >
          Buy ticket
        </button>
        <button
          className="mt-8 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground cta-glow"
          style={{ background: "var(--gradient-brand)" }}
        >
          View lottery
        </button>
      </div>
    </main>
  );
}
