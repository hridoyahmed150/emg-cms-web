"use client";

import { useRouter } from "next/navigation";
import { Building2, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useActiveOrg } from "@/lib/active-org-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { selectClass } from "@/components/meta-fields";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsOf(name?: string): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const { user, logout } = useAuth();
  const { isSuper, orgs, activeOrg, selectedOrgId, setSelectedOrgId } = useActiveOrg();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      {/* Active company — switcher for super admin, label for org admins */}
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        {isSuper ? (
          <select
            className={cn(selectClass, "h-8 w-auto font-medium")}
            value={selectedOrgId ?? ""}
            onChange={(e) => setSelectedOrgId(Number(e.target.value))}
            aria-label="Viewing company"
          >
            {orgs.length === 0 && <option value="">No organizations</option>}
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{activeOrg?.name}</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 outline-none transition-colors hover:bg-muted">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initialsOf(user?.name)}
            </span>
            <span className="hidden text-sm sm:inline">{user?.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col gap-0.5 px-2 py-1.5">
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
