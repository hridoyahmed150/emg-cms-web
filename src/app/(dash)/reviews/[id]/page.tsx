"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ReviewForm } from "@/components/review-form";
import type { Review } from "@/lib/types";

export default function EditReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Review>(`/api/v1/reviews/${id}`)
      .then(setReview)
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!review) return <div className="text-muted-foreground">Review not found.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Review</h1>
      <ReviewForm review={review} />
    </div>
  );
}
