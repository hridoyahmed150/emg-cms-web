"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, changePasswordRequest, loginRequest, logoutRequest, refreshAccessToken } from "./api";
import type { Organization, User } from "./types";

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const me = await api.get<{ user: User; organization: Organization | null }>(
      "/api/v1/auth/me",
    );
    setUser(me.user);
    setOrganization(me.organization);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await refreshAccessToken();
      if (token && active) {
        try {
          await loadMe();
        } catch {
          /* not logged in */
        }
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginRequest(email, password);
      await loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setOrganization(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const updated = await changePasswordRequest(currentPassword, newPassword);
    setUser(updated); // mustChangePassword flips to false → clears the first-login gate
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
