export default function SdrTemplatesPage() {
  return (
    <div className="mx-auto max-w-5xl py-10">
      <section className="rounded-2xl bg-surface-container p-10">
        <h1 className="font-headline text-5xl font-bold display-tight text-white">Templates</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Deterministic template library is being prepared. This placeholder keeps routing and shell navigation fully
          connected while template workflows are finalized.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Enterprise Intro", "Follow-up Sequence", "High Intent Reply"].map((name) => (
            <article key={name} className="rounded-xl bg-surface-low p-5">
              <p className="label-meta text-muted-foreground">Template</p>
              <p className="mt-1 font-headline text-2xl font-semibold display-tight text-white">{name}</p>
              <p className="mt-2 text-sm text-muted-foreground">Editable blocks and dynamic placeholders will appear here.</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
