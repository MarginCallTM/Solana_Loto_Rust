// Temporary smoke-test page. Verifies the design system (blue tokens, Inter, candy
// utilities) AND the first shadcn components (Button, Card). Replaced when we start
// porting the real maquette sections.
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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

      {/* shadcn Button — same component, different `variant` props */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button>default</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="outline">outline</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="link">link</Button>
        <Button size="sm">small</Button>
        <Button size="lg">large</Button>
      </div>

      {/* shadcn Card — composed from sub-components, plus our candy .cta-glow button */}
      <Card className="card-soft w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Round #1</CardTitle>
          <CardDescription>The vault is filling up.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">12.5 SOL</p>
          <p className="text-sm text-muted-foreground">142 tickets sold</p>
        </CardContent>
        <CardFooter>
          <Button className="cta-glow w-full">Buy a ticket</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
