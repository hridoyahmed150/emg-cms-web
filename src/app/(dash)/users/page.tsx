"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { selectClass } from "@/components/meta-fields";
import type { Organization, PermissionsMeta, Role, User } from "@/lib/types";

type ApiUser = User & { createdAt: string };

function formatDate(iso?: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [perms, setPerms] = useState<PermissionsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [orgId, setOrgId] = useState("");
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [permsFor, setPermsFor] = useState<ApiUser | null>(null);
  const [resetFor, setResetFor] = useState<ApiUser | null>(null);
  // The invite form is collapsed behind an "Add user" button by default.
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, o, p] = await Promise.all([
        api.get<ApiUser[]>("/api/v1/users"),
        api.get<Organization[]>("/api/v1/organizations"),
        api.get<PermissionsMeta>("/api/v1/meta/permissions"),
      ]);
      setUsers(u);
      setOrgs(o);
      setPerms(p);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "SUPER_ADMIN") void load();
    else setLoading(false);
  }, [load, currentUser]);

  useEffect(() => {
    if (!orgId && orgs.length) setOrgId(String(orgs[0]!.id));
  }, [orgs, orgId]);

  // User management is super-admin-only — match the backend (requireSuperAdmin).
  if (currentUser && currentUser.role !== "SUPER_ADMIN") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">User management is available to super admins only.</p>
      </div>
    );
  }

  const orgName = (id: number | null) => orgs.find((o) => o.id === id)?.name ?? "—";

  async function invite() {
    if (!email.trim() || !name.trim()) return toast.error("Email and name are required");
    if (role !== "SUPER_ADMIN" && !orgId) return toast.error("Select an organization for this user");
    setCreating(true);
    try {
      const body: Record<string, unknown> = { email, name, role };
      if (role !== "SUPER_ADMIN") body.organizationId = Number(orgId);
      const res = await api.post<{ tempPassword?: string }>("/api/v1/users", body);
      if (res.tempPassword) setTempPassword(res.tempPassword);
      setEmail("");
      setName("");
      toast.success("User invited");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Invite failed");
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.del(`/api/v1/users/${id}`);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Users</h1>
        {!showInvite && (
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="mr-2 size-4" /> Add user
          </Button>
        )}
      </div>

      {showInvite && (
      <Card>
        <CardHeader>
          <CardTitle>Invite a user</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <select
              className={selectClass}
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              disabled={role === "SUPER_ADMIN"}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Only super admins can create users and choose the organization. A strong temporary password
            is generated if you leave it blank.
          </p>
          <div className="flex gap-2">
            <Button onClick={invite} disabled={creating}>
              <UserPlus className="mr-2 size-4" /> {creating ? "Inviting…" : "Invite user"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowInvite(false);
                setTempPassword(null);
              }}
            >
              Cancel
            </Button>
          </div>

          {tempPassword && (
            <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-sm font-medium">Temporary password (share with the user):</p>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{tempPassword}</code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    void navigator.clipboard.writeText(tempPassword);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "SUPER_ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{orgName(u.organizationId)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.lastLoginAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="View permissions"
                      title="View permissions"
                      onClick={() => setPermsFor(u)}
                    >
                      <ShieldCheck className="size-4" />
                    </Button>
                    {/* Self-reset goes through Settings (self-service); hide it here for the current user. */}
                    {u.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Reset password"
                        title="Reset password"
                        onClick={() => setResetFor(u)}
                      >
                        <KeyRound className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(u.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PermissionsDialog user={permsFor} perms={perms} onClose={() => setPermsFor(null)} />
      <ResetPasswordDialog user={resetFor} onClose={() => setResetFor(null)} onDone={() => void load()} />
    </div>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
  onDone,
}: {
  user: ApiUser | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"generate" | "manual">("generate");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Reset the form on close so the next open starts fresh (no stale temp password / mode).
  function close() {
    setMode("generate");
    setPassword("");
    setBusy(false);
    setTempPassword(null);
    onClose();
  }

  async function submit() {
    if (!user) return;
    if (mode === "manual" && password.length < 10) {
      return toast.error("Password must be at least 10 characters.");
    }
    setBusy(true);
    try {
      const body = mode === "manual" ? { password } : {};
      const res = await api.post<{ tempPassword?: string }>(`/api/v1/users/${user.id}/reset-password`, body);
      onDone();
      if (res.tempPassword) {
        setTempPassword(res.tempPassword);
        toast.success("Temporary password generated.");
      } else {
        toast.success("Password reset. The user must set a new one at next login; their other sessions were signed out.");
        close();
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={user != null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password — {user?.name}</DialogTitle>
          <DialogDescription>
            {user?.email}. The user must set their own password at next login, and all their existing
            sessions will be signed out.
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="text-sm font-medium">Temporary password (share with the user):</p>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{tempPassword}</code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  void navigator.clipboard.writeText(tempPassword);
                  toast.success("Copied");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <Button className="w-full" onClick={close}>
              Done
            </Button>
          </div>
        ) : mode === "generate" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A strong temporary password will be generated and shown once.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={submit} disabled={busy}>
                <KeyRound className="mr-2 size-4" /> {busy ? "Generating…" : "Generate temporary password"}
              </Button>
              <Button variant="ghost" onClick={() => setMode("manual")}>
                Set a specific password instead
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 10 characters, with 2+ character types (letters, digits, symbols).
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={busy || password.length < 10}>
                {busy ? "Setting…" : "Set password"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("generate");
                  setPassword("");
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PermissionsDialog({
  user,
  perms,
  onClose,
}: {
  user: ApiUser | null;
  perms: PermissionsMeta | null;
  onClose: () => void;
}) {
  const rolePerms = user && perms ? (perms.roles[user.role] ?? []) : [];
  const isFullAccess = rolePerms.includes("*");
  const granted = new Set(rolePerms);

  // Group the catalog for display.
  const groups: Record<string, { key: string; label: string }[]> = {};
  for (const c of perms?.catalog ?? []) {
    (groups[c.group] ??= []).push({ key: c.key, label: c.label });
  }

  return (
    <Dialog open={user != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Permissions — {user?.name}</DialogTitle>
          <DialogDescription>
            Derived from the role <span className="font-medium">{user?.role}</span>. Read-only for now.
          </DialogDescription>
        </DialogHeader>

        {isFullAccess ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
            <span className="font-medium">Full access</span> — this super admin has every permission (
            <code>*</code>).
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <ul className="space-y-1">
                  {items.map((it) => {
                    const on = granted.has(it.key);
                    return (
                      <li
                        key={it.key}
                        className={`flex items-center gap-2 text-sm ${on ? "" : "text-muted-foreground/50"}`}
                      >
                        {on ? (
                          <Check className="size-4 shrink-0 text-green-600" />
                        ) : (
                          <span className="inline-block size-4 shrink-0 text-center">—</span>
                        )}
                        {it.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
