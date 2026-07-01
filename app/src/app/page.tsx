// Temporary palette smoke-test page. It only exists to verify the design system
// (blue tokens, Inter font, candy utilities) renders. We replace it when we start
// porting the real maquette sections.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-background p-10 text-foreground">
      {/* Display font + brand gradient text */}
      <h1 className="font-display text-5xl">
        <span className="brand-text">Solvault</span> palette check
      </h1>

      {/* Color swatches straight from the tokens */}
      <div className="flex flex-wrap justify-center gap-3">
        <span className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">primary</span>
        <span className="rounded-lg bg-accent px-4 py-3 text-accent-foreground">accent</span>
        <span className="rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">secondary</span>
        <span className="rounded-lg bg-muted px-4 py-3 text-muted-foreground">muted</span>
        <span className="rounded-lg bg-success px-4 py-3 text-success-foreground">success</span>
        <span className="rounded-lg bg-destructive px-4 py-3 text-white">destructive</span>
      </div>

      {/* A soft card + a glowing CTA + a floating dot to test the utilities */}
      <div className="card-soft flex items-center gap-6 rounded-2xl border bg-card p-6">
        <button className="cta-glow rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground">
          Buy a ticket
        </button>
        <div className="float-y size-8 rounded-full bg-primary" />
      </div>
    </main>
  );
}
