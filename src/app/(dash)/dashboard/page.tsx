"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Briefcase, Gauge, Plus, Send, Star } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { api } from "@/lib/api";
import { useActiveOrg } from "@/lib/active-org-context";
import { getReviewsConfig } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeliveryJob, Job, Organization, Paginated, Review } from "@/lib/types";

const reviewsConfig = {
  count: { label: "Reviews", color: "var(--chart-1)" },
} satisfies ChartConfig;

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function monthlyReviewSeries(reviews: Review[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en", { month: "short" }), count: 0 };
  });
  for (const r of reviews) {
    const d = new Date(r.time);
    const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

const statusVariant: Record<Job["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  draft: "secondary",
  expired: "outline",
};

/** Companies whose reviews are due for a refresh (have a reviews config + past their cadence). */
function reviewsDue(orgs: Organization[]) {
  return orgs.filter((o) => {
    const rc = getReviewsConfig(o);
    const hasReviews = Object.keys(rc).length > 0;
    if (!hasReviews) return false;
    const every = rc.syncEveryDays ?? 15;
    return rc.lastRefreshedAt == null || (Date.now() - rc.lastRefreshedAt) / 86_400_000 >= every;
  });
}

export default function DashboardPage() {
  const { isSuper, orgs, activeOrg } = useActiveOrg();
  const dueOrgs = reviewsDue(isSuper ? orgs : activeOrg ? [activeOrg] : []);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [openDeliveries, setOpenDeliveries] = useState(0);

  useEffect(() => {
    api
      .get<Paginated<Job>>("/api/v1/jobs?limit=100")
      .then((r) => {
        setJobs(r.items);
        setJobsTotal(r.total);
      })
      .catch(() => {});
    api
      .get<Paginated<Review>>("/api/v1/reviews?limit=100")
      .then((r) => {
        setReviews(r.items);
        setReviewsTotal(r.total);
      })
      .catch(() => {});
    api
      .get<DeliveryJob[]>("/api/v1/delivery-jobs")
      .then((d) => setOpenDeliveries(d.filter((x) => x.status !== "success").length))
      .catch(() => {});
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const ratingData = [1, 2, 3, 4, 5].map((n) => ({
    rating: `${n}★`,
    count: reviews.filter((r) => r.rating === n).length,
  }));
  const reviewSeries = monthlyReviewSeries(reviews);
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-6 text-base">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Pages / Dashboard</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs/new" className={buttonVariants({ variant: "outline" })}>
            <Plus className="mr-2 size-4" /> New Job
          </Link>
          <Link href="/reviews/new" className={buttonVariants()}>
            <Plus className="mr-2 size-4" /> New Review
          </Link>
        </div>
      </div>

      {/* Reviews refresh reminder (per-company, ~15-day cadence) */}
      {dueOrgs.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <BellRing className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-medium">Reviews refresh due</span> for{" "}
              {dueOrgs.map((o) => o.name).join(", ")}.
            </p>
            <Link href="/reviews" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Go to Reviews
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={jobsTotal} />
        <StatCard icon={Star} label="Total Reviews" value={reviewsTotal} />
        <StatCard icon={Gauge} label="Avg Rating" value={avgRating} hint="across all reviews" />
        <StatCard icon={Send} label="Open Deliveries" value={openDeliveries} hint="pending / running / failed" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reviews over time</CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={reviewsConfig} className="h-[260px] w-full">
              <AreaChart data={reviewSeries} margin={{ left: 4, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="fillReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area
                  dataKey="count"
                  type="natural"
                  fill="url(#fillReviews)"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Reviews by star rating</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={reviewsConfig} className="h-[260px] w-full">
              <BarChart data={ratingData} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="rating" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent jobs */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent jobs</CardTitle>
          <Link href="/jobs" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No jobs yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="pl-6 font-medium">{job.title}</TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
                    </TableCell>
                    <TableCell className="pr-6">{new Date(job.posted).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
