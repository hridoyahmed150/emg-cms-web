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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUploader } from "@/components/image-uploader";
import { MetaFields, metaDefaults, selectClass } from "@/components/meta-fields";
import type { FieldDef, Review } from "@/lib/types";

const ReviewFormSchema = z.object({
  name: z.string().min(1, "Required"),
  avatar: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1, "Required"),
  time: z.string().min(1, "Required"),
  featured: z.boolean(),
  verified: z.boolean(),
  reviewUrl: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
type ReviewFormValues = z.infer<typeof ReviewFormSchema>;

export function ReviewForm({ review }: { review?: Review }) {
  const router = useRouter();
  const { activeOrg } = useActiveOrg();
  const defs = (activeOrg?.customFields?.reviews ?? []) as FieldDef[];

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      name: review?.name ?? "",
      avatar: review?.avatar ?? "",
      rating: review?.rating ?? 5,
      text: review?.text ?? "",
      time: new Date(review?.time ?? Date.now()).toISOString().slice(0, 10),
      featured: review?.featured ?? false,
      verified: review?.verified ?? true,
      reviewUrl: review?.reviewUrl ?? "",
      meta: metaDefaults(defs, review?.meta),
    },
  });

  async function onSubmit(values: ReviewFormValues) {
    const payload: Record<string, unknown> = {
      name: values.name,
      rating: values.rating,
      text: values.text,
      time: new Date(values.time).getTime(),
      featured: values.featured,
      verified: values.verified,
      meta: values.meta ?? {},
    };
    if (values.avatar) payload.avatar = values.avatar;
    if (values.reviewUrl) payload.reviewUrl = values.reviewUrl;

    try {
      if (review) await api.patch(`/api/v1/reviews/${review.id}`, payload);
      else await api.post("/api/v1/reviews", payload);
      toast.success(review ? "Review updated" : "Review created");
      router.push("/reviews");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reviewer name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile photo</FormLabel>
              <ImageUploader value={field.value ?? ""} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <select
                    className={selectClass}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
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
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review text</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://g.co/…" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Link to the original Google review (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured</FormLabel>
                <FormControl>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground">Highlight on site</span>
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="verified"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verified</FormLabel>
                <FormControl>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground">Verified review</span>
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <MetaFields control={form.control as unknown as Control<FieldValues>} defs={defs} />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {review ? "Save changes" : "Create review"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/reviews")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
