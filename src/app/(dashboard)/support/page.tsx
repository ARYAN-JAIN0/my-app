export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <h1 className="font-headline text-5xl font-bold display-tight text-white">Support</h1>
      <section className="rounded-xl bg-surface-container p-5 space-y-2">
        <p className="text-muted-foreground">Operational checks for REVO:</p>
        <p className="text-sm text-muted-foreground">1. Verify DB connectivity.</p>
        <p className="text-sm text-muted-foreground">2. Verify AI providers are reachable.</p>
        <p className="text-sm text-muted-foreground">3. Verify Gmail OAuth and sync status.</p>
      </section>
    </div>
  );
}
