"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ChangePasswordCard() {
  const { user, changePassword } = useAuth();
  // Collapsed behind a button by default; auto-open when forced (temp/admin-set password).
  const forced = Boolean(user?.mustChangePassword);
  const [open, setOpen] = useState(forced);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  function clearFields() {
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    if (next.length < 10) {
      toast.error("New password must be at least 10 characters.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success("Password changed. Other sessions have been logged out.");
      clearFields();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        {!open ? (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <KeyRound className="mr-2 size-4" /> Change password
          </Button>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
              <p className="text-xs text-muted-foreground">At least 10 characters, with 2+ character types (letters, digits, symbols).</p>
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !current || !next || !confirm}>
                {saving ? "Changing…" : "Change password"}
              </Button>
              {!forced && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    clearFields();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, organization, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {user?.mustChangePassword && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">Set a new password</p>
          <p className="mt-1 text-muted-foreground">
            You&apos;re signed in with a temporary password. Please choose your own password below before continuing.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Name" value={user?.name} />
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={<Badge variant="secondary">{user?.role}</Badge>} />
        </CardContent>
      </Card>

      <ChangePasswordCard />

      {organization && (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Name" value={organization.name} />
            <Row label="Slug" value={organization.slug} />
            <Row label="Delivery target" value={organization.deliveryTarget} />
          </CardContent>
        </Card>
      )}

      <Button variant="destructive" onClick={handleLogout}>
        <LogOut className="mr-2 size-4" /> Log out
      </Button>
    </div>
  );
}
