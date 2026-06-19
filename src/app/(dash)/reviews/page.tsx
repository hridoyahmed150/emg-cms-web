"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveOrg } from "@/lib/active-org-context";
import { getReviewsConfig, type Paginated, type Review, type ReviewsConfig } from "@/lib/types";

type ImportResult = { received: number; inserted: number; skipped: number };

const IMPORT_PLACEHOLDER = `[
  { "name": "Jane D.", "rating": 5, "text": "Fantastic service!", "time": "2026-06-10", "externalId": "g-abc123" }
]`;

// Module-level (not called during component render) so Date.now stays out of render.
function refreshStatus(rc: ReviewsConfig): { daysSince: number | null; due: boolean; every: number } {
  const every = rc.syncEveryDays ?? 15;
  const daysSince =
    rc.lastRefreshedAt != null ? Math.floor((Date.now() - rc.lastRefreshedAt) / 86_400_000) : null;
  return { daysSince, due: daysSince == null || daysSince >= every, every };
}

export default function ReviewsPage() {
  const { activeOrg } = useActiveOrg();
  const rc = getReviewsConfig(activeOrg);
  const { daysSince, due: dueForRefresh, every: syncEveryDays } = refreshStatus(rc);
  const canAutoRefresh = rc.source === "places" || rc.source === "gbp";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<Paginated<Review>>("/api/v1/reviews?limit=100");
      setReviews(r.items);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: number) {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.del(`/api/v1/reviews/${id}`);
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  async function refreshFromGoogle() {
    setRefreshing(true);
    try {
      const r = await api.post<ImportResult>("/api/v1/reviews/refresh");
      toast.success(`Refreshed: ${r.inserted} new, ${r.skipped} already had`);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function runImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      toast.error("That isn't valid JSON.");
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast.error("Paste a non-empty JSON array of reviews.");
      return;
    }
    setImporting(true);
    try {
      const r = await api.post<ImportResult>("/api/v1/reviews/import", { reviews: parsed });
      toast.success(`Imported: ${r.inserted} new, ${r.skipped} duplicate`);
      setImportText("");
      setShowImport(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {rc.lastRefreshedAt != null
              ? `Last refreshed ${daysSince === 0 ? "today" : `${daysSince} day${daysSince === 1 ? "" : "s"} ago`}`
              : "Never refreshed"}
            {" · "}
            {dueForRefresh ? (
              <Badge variant="destructive">Refresh due</Badge>
            ) : (
              <span className="text-muted-foreground">next due in {syncEveryDays - (daysSince ?? 0)} days</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAutoRefresh && (
            <Button variant="outline" onClick={refreshFromGoogle} disabled={refreshing}>
              <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh from Google"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowImport((v) => !v)}>
            <Upload className="mr-2 size-4" /> Import
          </Button>
          <Link href="/reviews/new" className={buttonVariants()}>
            <Plus className="mr-2 size-4" /> New Review
          </Link>
        </div>
      </div>

      {showImport && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">Bulk import reviews</p>
            <p className="text-xs text-muted-foreground">
              Paste a JSON array. Re-importing the full list is safe — duplicates are skipped (by{" "}
              <code>externalId</code>, or name+time+text). Fields: <code>name</code>, <code>rating</code> (1–5),{" "}
              <code>text</code>, <code>time</code> (date or unix ms), optional <code>avatar</code>,{" "}
              <code>reviewUrl</code>, <code>externalId</code>.
            </p>
          </div>
          <Textarea
            rows={8}
            className="font-mono text-xs"
            placeholder={IMPORT_PLACEHOLDER}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={runImport} disabled={importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
            <Button variant="ghost" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No reviews yet.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    {review.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="size-7 rounded-full object-cover"
                      />
                    ) : null}
                    {review.name}
                  </TableCell>
                  <TableCell>{"★".repeat(review.rating)}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {review.text}
                  </TableCell>
                  <TableCell>
                    {review.featured ? <Badge>Featured</Badge> : null}
                  </TableCell>
                  <TableCell>{new Date(review.time).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/reviews/${review.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(review.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
