"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { api } from "./api";
import { getActiveOrgId, setActiveOrgId } from "./active-org";
import type { Organization } from "./types";

interface ActiveOrgContextValue {
  isSuper: boolean;
  orgs: Organization[];
  /** The org whose data is currently in view (admin's own org, or super's selection). */
  activeOrg: Organization | null;
  selectedOrgId: number | null;
  setSelectedOrgId: (id: number) => void;
  /** Re-fetch the org list (call after creating/editing an org so the switcher updates without a reload). */
  refreshOrgs: () => Promise<void>;
}

const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(null);

export function ActiveOrgProvider({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelected] = useState<number | null>(getActiveOrgId());

  const refreshOrgs = useCallback(async () => {
    if (!isSuper) return;
    try {
      const list = await api.get<Organization[]>("/api/v1/organizations");
      setOrgs(list);
      // First-time super_admin with no selection → pick the first org and re-scope.
      if (getActiveOrgId() == null && list.length > 0) {
        setActiveOrgId(list[0]!.id);
        setSelected(list[0]!.id);
        window.location.reload();
      }
    } catch {
      // network/auth errors are surfaced elsewhere; keep the switcher quietly empty.
    }
  }, [isSuper]);

  useEffect(() => {
    refreshOrgs();
  }, [refreshOrgs]);

  function setSelectedOrgId(id: number) {
    setActiveOrgId(id);
    setSelected(id);
    window.location.reload(); // re-fetch every page's data scoped to the new org
  }

  const activeOrg = isSuper
    ? (orgs.find((o) => o.id === selectedOrgId) ?? null)
    : (organization ?? null);

  return (
    <ActiveOrgContext.Provider
      value={{ isSuper: Boolean(isSuper), orgs, activeOrg, selectedOrgId, setSelectedOrgId, refreshOrgs }}
    >
      {children}
    </ActiveOrgContext.Provider>
  );
}

export function useActiveOrg(): ActiveOrgContextValue {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) throw new Error("useActiveOrg must be used within <ActiveOrgProvider>");
  return ctx;
}
