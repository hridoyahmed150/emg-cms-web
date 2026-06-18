import { ReviewForm } from "@/components/review-form";

export default function NewReviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Review</h1>
      <ReviewForm />
    </div>
  );
}
