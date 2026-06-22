import { JobForm } from "@/components/job-form";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">New Job</h1>
      <JobForm />
    </div>
  );
}
