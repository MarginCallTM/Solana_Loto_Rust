"use client";

// Design test: sparkles logo cloud instead of the marquee (revertible).
// Light variant: transparent background so it blends with the Hero's white
// gradient-hero; blue particles + a soft blue glow so they read on white.
import { SparklesCore } from "@/components/ui/sparkles";

const logos = [
  { src: "/solana.png", alt: "Solana" },
  { src: "/phantom.png", alt: "Phantom" },
  { src: "/backpack.jpeg", alt: "Backpack" },
  { src: "/jupiter.png", alt: "Jupiter" },
  { src: "/superteam.svg", alt: "Superteam" },
  { src: "/solflare.svg", alt: "Solflare" },
];

export function PoweredBySparkles() {
  return (
    <div className="relative overflow-hidden">
      {/* Logos row */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-10">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Powered by
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((l) => (
            <span
              key={l.alt}
              className="inline-flex items-center gap-2 font-display text-sm text-foreground/80"
            >
              <img src={l.src} alt={l.alt} className="size-6 rounded-md" />
              {l.alt}
            </span>
          ))}
        </div>
      </div>

      {/* Sparkles field on light background: soft blue glow + light-blue "planet"
          (sky-soft from our palette) with a subtle primary horizon line. */}
      <div className="relative h-64 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#3981f6,transparent_70%)] before:opacity-20 after:absolute after:top-1/2 after:-left-1/2 after:aspect-[1/0.7] after:w-[200%] after:rounded-[100%] after:border-t after:border-primary/30 after:bg-sky-soft/80">
        <SparklesCore
          id="poweredby-sparkles"
          background="transparent"
          minSize={1}
          maxSize={2.8}
          particleDensity={280}
          particleColor="#3981f6"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </div>
    </div>
  );
}
