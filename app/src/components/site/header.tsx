// Site header — ported 1:1 from the Lovable maquette (Header section).
// Stateless + asset-free, so it stays a Server Component (no "use client").
// The "Connect wallet" link is still a mock; it gets wired to the real wallet
// hook in phase 10.6, and the "mainnet" wording is corrected in 10.16.
export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <a href="/" className="flex items-center gap-2">
          <span
            className="grid size-8 place-items-center rounded-xl text-primary-foreground font-display text-sm"
            style={{ background: "var(--gradient-brand)" }}
          >
            S
          </span>
          <span className="font-display text-lg tracking-tight">Solvault</span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {["Lotteries", "How it works", "Winners", "Docs"].map((l) => (
            <a
              key={l}
              href="#"
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="hidden rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary sm:inline-flex"
          >
            View lottery
          </a>
          <a
            href="#play"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground cta-glow"
            style={{ background: "var(--gradient-brand)" }}
          >
            <span className="size-1.5 rounded-full bg-white/90" /> Connect wallet
          </a>
        </div>
      </div>
    </header>
  );
}
