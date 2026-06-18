"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { JobForm } from "@/components/job-form";
import type { Job } from "@/lib/types";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Job>(`/api/v1/jobs/${id}`)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!job) return <div className="text-muted-foreground">Job not found.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Job</h1>
      <JobForm job={job} />
    </div>
  );
}
