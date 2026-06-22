"use client";

import { useRouter } from "next/navigation";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useActiveOrg } from "@/lib/active-org-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MetaFields, metaDefaults, selectClass } from "@/components/meta-fields";
import type { FieldDef, Job } from "@/lib/types";

const JobFormSchema = z.object({
  title: z.string().min(1, "Required"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case, e.g. senior-developer"),
  type: z.string().min(1, "Required"),
  location: z.string().min(1, "Required"),
  posted: z.string().min(1, "Required"),
  status: z.enum(["active", "expired", "draft"]),
  meta: z.record(z.string(), z.unknown()).optional(),
});
type JobFormValues = z.infer<typeof JobFormSchema>;

const JOB_TYPES = ["full-time", "part-time", "contract"];
const STATUSES = ["active", "expired", "draft"];

export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const { activeOrg } = useActiveOrg();
  const defs = (activeOrg?.customFields?.jobs ?? []) as FieldDef[];

  const form = useForm<JobFormValues>({
    resolver: zodResolver(JobFormSchema),
    defaultValues: {
      title: job?.title ?? "",
      slug: job?.slug ?? "",
      type: job?.type ?? "full-time",
      location: job?.location ?? "",
      posted: (job?.posted ?? new Date().toISOString()).slice(0, 10),
      status: job?.status ?? "active",
      meta: metaDefaults(defs, job?.meta),
    },
  });

  async function onSubmit(values: JobFormValues) {
    const payload = { ...values, meta: values.meta ?? {} };
    try {
      if (job) await api.patch(`/api/v1/jobs/${job.id}`, payload);
      else await api.post("/api/v1/jobs", payload);
      toast.success(job ? "Job updated" : "Job created");
      router.push("/jobs");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="senior-developer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <select className={selectClass} {...field}>
                    {JOB_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <select className={selectClass} {...field}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="posted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Posted</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <MetaFields control={form.control as unknown as Control<FieldValues>} defs={defs} />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {job ? "Save changes" : "Create job"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/jobs")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
