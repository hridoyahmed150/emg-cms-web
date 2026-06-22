"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveOrg } from "@/lib/active-org-context";
import { PublishButton } from "@/components/publish-button";
import { getGitConfig, type Job, type Paginated } from "@/lib/types";

type ImportResult = { received: number; inserted: number; skipped: number; note?: string };

const statusVariant: Record<Job["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  draft: "secondary",
  expired: "outline",
};

export default function JobsPage() {
  const { activeOrg } = useActiveOrg();
  const canRepoImport = activeOrg?.deliveryTarget === "ASTRO_PULL" && !!getGitConfig(activeOrg).jobsPath;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoImporting, setRepoImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<Paginated<Job>>("/api/v1/jobs?limit=100");
      setJobs(r.items);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: number) {
    if (!window.confirm("Delete this job?")) return;
    try {
      await api.del(`/api/v1/jobs/${id}`);
      toast.success("Job deleted");
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  async function importFromRepo() {
    if (
      !window.confirm(
        "Import the repo's existing jobs.json into the CMS?\n\nBest done during onboarding — before publishing — so pre-existing jobs aren't overwritten. Duplicates (same slug) are skipped.",
      )
    )
      return;
    setRepoImporting(true);
    try {
      const r = await api.post<ImportResult>("/api/v1/jobs/import-from-repo");
      toast.success(r.note ?? `Imported from repo: ${r.inserted} new, ${r.skipped} duplicate`);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Repo import failed");
    } finally {
      setRepoImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PublishButton />
          {canRepoImport && (
            <Button variant="outline" onClick={importFromRepo} disabled={repoImporting}>
              <GitBranch className="mr-2 size-4" />
              {repoImporting ? "Importing…" : "Import from repo"}
            </Button>
          )}
          <Link href="/jobs/new" className={buttonVariants()}>
            <Plus className="mr-2 size-4" /> New Job
          </Link>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
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
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No jobs yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(job.posted).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(job.id)}
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
