"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  KeyRound,
  LayoutDashboard,
  Send,
  Star,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useActiveOrg } from "@/lib/active-org-context";
import { isFeatureEnabled } from "@/lib/types";
import { cn } from "@/lib/utils";

// Content modules — shown only when the active org has the feature enabled.
const contentNav = [
  { href: "/jobs", label: "Jobs", icon: Briefcase, feature: "jobs" },
  { href: "/reviews", label: "Reviews", icon: Star, feature: "reviews" },
];

// SUPER_ADMIN-only. API Tokens lives here: consumer read tokens are an agency-side
// onboarding concern (issued by EMG for WordPress/external consumers), not a client task.
const superNav = [
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/api-tokens", label: "API Tokens", icon: KeyRound },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { activeOrg } = useActiveOrg();
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...contentNav.filter((n) => isFeatureEnabled(activeOrg, n.feature)),
    { href: "/delivery", label: "Delivery", icon: Send },
    ...(user?.role === "SUPER_ADMIN" ? superNav : []),
  ];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      {/* h-14 + px-4 mirrors the Topbar so the sidebar logo's bottom border lines up with the topbar's. */}
      <div className="flex h-14 items-center border-b px-4">
        {/* Light bg -> dark logo; dark bg -> white logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emg-logo-light.svg" alt="Everyday Media Group" className="h-7 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emg-logo.svg" alt="Everyday Media Group" className="hidden h-7 w-auto dark:block" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
