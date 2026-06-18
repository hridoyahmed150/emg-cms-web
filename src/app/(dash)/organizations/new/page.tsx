import { OrgForm } from "@/components/org-form";

export default function NewOrganizationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Organization</h1>
      <OrgForm />
    </div>
  );
}
