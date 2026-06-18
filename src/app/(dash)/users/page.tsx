"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { selectClass } from "@/components/meta-fields";
import type { Organization, Role, User } from "@/lib/types";

type ApiUser = User & { createdAt: string };

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [orgId, setOrgId] = useState("");
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, o] = await Promise.all([
        api.get<ApiUser[]>("/api/v1/users"),
        api.get<Organization[]>("/api/v1/organizations"),
      ]);
      setUsers(u);
      setOrgs(o);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orgId && orgs.length) setOrgId(String(orgs[0]!.id));
  }, [orgs, orgId]);

  const orgName = (id: number | null) => orgs.find((o) => o.id === id)?.name ?? "—";

  async function invite() {
    if (!email.trim() || !name.trim()) return toast.error("Email and name are required");
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
      <h1 className="text-2xl font-semibold">Users</h1>

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
          <Button onClick={invite} disabled={creating}>
            <UserPlus className="mr-2 size-4" /> {creating ? "Inviting…" : "Invite user"}
          </Button>

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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="w-16 text-right">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
                  <TableCell className="text-right">
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
    </div>
  );
}
