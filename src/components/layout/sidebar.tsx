"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  FileText,
  HelpCircle,
  PersonStanding,
  Settings,
  Upload,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const primaryRoutes = [
  { label: "Leads", href: "/sdr", icon: PersonStanding },
  { label: "Import Leads", href: "/sdr/import-leads", icon: Upload },
  { label: "Templates", href: "/sdr/templates", icon: FileText },
  { label: "Analytics", href: "/sdr/analytics", icon: BarChart3 },
];

const secondaryRoutes = [
  { label: "Settings", href: "#", icon: Settings },
  { label: "Support", href: "#", icon: HelpCircle },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/sdr") return pathname === "/sdr";
  return pathname.startsWith(href);
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant/20 bg-sidebar p-4 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="mb-6 flex items-start justify-between px-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-primary-lithic font-headline font-black">
              R
            </div>
            <div>
              <h1 className="font-headline text-2xl font-black display-tight text-primary">
                REVO
              </h1>
              <p className="label-meta text-muted-foreground">Precision Intelligence</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-1">
          {primaryRoutes.map((route) => {
            const active = isActivePath(pathname, route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-3 font-headline text-sm uppercase tracking-[0.08em] transition-all",
                  active
                    ? "bg-surface-container-low text-white shadow-[inset_-3px_0_0_0_#a3a6ff]"
                    : "text-foreground/45 hover:bg-surface-container-low/60 hover:text-foreground"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-outline-variant/10 pt-6">
          {secondaryRoutes.map((route) => (
            <Link
              key={route.label}
              href={route.href}
              className="flex items-center gap-3 rounded-md px-4 py-3 font-headline text-sm uppercase tracking-[0.08em] text-foreground/45 transition-all hover:bg-surface-container-low/60 hover:text-foreground"
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
