export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3x1 px-6 py-24">
        <span className="inline-flex items-center gap-2 rounded-full border
        border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-succes">
            Live on Solana devnet
          </span>
        </span>
      </div>
    </main>
  )
}