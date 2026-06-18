"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeliveryJob } from "@/lib/types";

const statusVariant: Record<DeliveryJob["status"], "default" | "secondary" | "outline" | "destructive"> = {
  success: "default",
  pending: "secondary",
  running: "outline",
  failed: "destructive",
};

export default function DeliveryPage() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setJobs(await api.get<DeliveryJob[]>("/api/v1/delivery-jobs"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load delivery jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(id: number) {
    try {
      await api.post(`/api/v1/delivery-jobs/${id}/retry`);
      toast.success("Re-queued");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Retry failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Delivery</h1>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 size-4" /> Refresh
        </Button>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        Rebuild / cache-bust jobs triggered when content changes.
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Result / Error</TableHead>
              <TableHead className="w-16 text-right">Retry</TableHead>
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
                  No delivery jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.collection}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[j.status]}>{j.status}</Badge>
                  </TableCell>
                  <TableCell>{j.attempts}</TableCell>
                  <TableCell>{new Date(j.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {j.error ?? j.result ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {j.status === "failed" ? (
                      <Button variant="ghost" size="icon" aria-label="Retry" onClick={() => retry(j.id)}>
                        <RotateCcw className="size-4" />
                      </Button>
                    ) : (
                      "—"
                    )}
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
