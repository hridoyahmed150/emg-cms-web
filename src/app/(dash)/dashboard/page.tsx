"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Paginated, Job, Review } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<number | null>(null);
  const [reviews, setReviews] = useState<number | null>(null);

  useEffect(() => {
    api.get<Paginated<Job>>("/api/v1/jobs?limit=1").then((r) => setJobs(r.total)).catch(() => {});
    api
      .get<Paginated<Review>>("/api/v1/reviews?limit=1")
      .then((r) => setReviews(r.total))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {user?.role === "SUPER_ADMIN" ? "Agency super admin" : "Organization admin"}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobs ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reviews ?? "—"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
