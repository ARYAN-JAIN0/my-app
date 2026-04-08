import Link from "next/link";

const links = [
  { href: "/status", label: "System Status", description: "Run health checks and inspect feature readiness." },
  { href: "/jobs", label: "Pipeline Jobs", description: "Track imports, queue work, and processing state." },
  { href: "/data", label: "Data Explorer", description: "Inspect leads, messages, approvals, and audit logs." },
  { href: "/qa", label: "Stress & QA", description: "Run load scenarios and validate throughput." },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <h1 className="font-headline text-5xl font-bold display-tight text-white">Support</h1>
      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <p className="text-muted-foreground">Operational shortcuts for Rivo.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg border border-outline-variant/20 p-4 transition hover:bg-surface-container-low">
              <p className="font-medium">{link.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
