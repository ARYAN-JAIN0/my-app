"use client";

import Link from "next/link";
import { Menu, RefreshCw, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const titles: Record<string, string> = {
  "/sdr": "SDR Workspace",
  "/sdr/import-leads": "Import Leads",
  "/sdr/templates": "Templates",
  "/sdr/analytics": "Analytics Engine",
  "/crm": "CRM Dashboard",
  "/finance": "Finance Dashboard",
  "/negotiation": "Negotiation",
  "/rag": "RAG Workspace",
  "/settings": "Workspace Settings",
  "/status": "System Status",
  "/jobs": "Pipeline Jobs",
  "/data": "Data Explorer",
  "/qa": "Stress & QA",
  "/support": "Support",
};

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Rivo Workspace";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/20 bg-background/85 px-4 backdrop-blur-md ambient-glow lg:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h2 className="font-headline text-lg font-semibold text-primary display-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-foreground/60 transition-colors hover:bg-surface-bright md:flex"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
        <Link
          href="/settings"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-bright hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1.5">
          <div className="text-right leading-tight">
            <p className="text-xs font-semibold text-foreground">Rivo Operator</p>
            <p className="text-[10px] text-muted-foreground">Default Workspace</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-surface-container-low text-xs font-bold text-primary">
            RV
          </div>
        </div>
      </div>
    </header>
  );
}

