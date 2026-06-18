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
import { cn } from "@/lib/utils";

const baseNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/api-tokens", label: "API Tokens", icon: KeyRound },
  { href: "/delivery", label: "Delivery", icon: Send },
];

const superNav = [
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
];

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const items = [...baseNav, ...(user?.role === "SUPER_ADMIN" ? superNav : [])];

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-slate-900 text-slate-200">
      <div className="p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emg-logo.svg" alt="Everyday Media Group" className="h-7 w-auto" />
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
