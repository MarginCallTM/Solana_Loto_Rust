// Landing page. We assemble the maquette section by section here.
// Order (from the reference): Ticker -> Header -> Hero -> ... -> Footer.
import { Ticker } from "@/components/site/ticker";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Ticker />
      <Header />
      <main>
        <Hero />
        {/* Lotteries, HowItWorks, Trust, Stats, FinalCTA, Footer are ported next. */}
      </main>
    </div>
  );
}
