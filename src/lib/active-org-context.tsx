"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
}

const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(null);

export function ActiveOrgProvider({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelected] = useState<number | null>(getActiveOrgId());

  useEffect(() => {
    if (!isSuper) return;
    api
      .get<Organization[]>("/api/v1/organizations")
      .then((list) => {
        setOrgs(list);
        // First-time super_admin with no selection → pick the first org and re-scope.
        if (getActiveOrgId() == null && list.length > 0) {
          setActiveOrgId(list[0]!.id);
          setSelected(list[0]!.id);
          window.location.reload();
        }
      })
      .catch(() => undefined);
  }, [isSuper]);

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
      value={{ isSuper: Boolean(isSuper), orgs, activeOrg, selectedOrgId, setSelectedOrgId }}
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
