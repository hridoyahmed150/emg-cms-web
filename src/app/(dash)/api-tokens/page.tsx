"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
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
import type { ApiToken } from "@/lib/types";

const ALL_SCOPES = ["jobs:read", "reviews:read"];

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([...ALL_SCOPES]);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTokens(await api.get<ApiToken[]>("/api/v1/tokens"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleScope(s: string) {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function create() {
    if (!name.trim()) return toast.error("Token name is required");
    if (scopes.length === 0) return toast.error("Select at least one scope");
    setCreating(true);
    try {
      const res = await api.post<{ token: string }>("/api/v1/tokens", { name, scopes });
      setNewToken(res.token);
      setName("");
      toast.success("Token created — copy it now");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create token");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: number) {
    if (!window.confirm("Revoke this token? Consumers using it will stop working.")) return;
    try {
      await api.del(`/api/v1/tokens/${id}`);
      toast.success("Token revoked");
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Revoke failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">API Tokens</h1>
      <p className="-mt-2 text-sm text-muted-foreground">
        Read-only tokens for your Astro build / WordPress plugin to pull content.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Create a consumer token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Token name (e.g. EIS-TX Astro build)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-4">
            {ALL_SCOPES.map((s) => (
              <label key={s} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={scopes.includes(s)}
                  onChange={() => toggleScope(s)}
                />
                {s}
              </label>
            ))}
          </div>
          <Button onClick={create} disabled={creating}>
            {creating ? "Creating…" : "Create token"}
          </Button>

          {newToken && (
            <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-sm font-medium">Copy this token now — it won&apos;t be shown again:</p>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{newToken}</code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    void navigator.clipboard.writeText(newToken);
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
              <TableHead>Scopes</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-16 text-right">Revoke</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No tokens yet.
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(t.scopes ?? []).map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "—"}</TableCell>
                  <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label="Revoke" onClick={() => revoke(t.id)}>
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
