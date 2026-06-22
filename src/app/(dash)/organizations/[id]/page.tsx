"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { OrgForm } from "@/components/org-form";
import type { Organization } from "@/lib/types";

export default function EditOrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Organization>(`/api/v1/organizations/${id}`)
      .then(setOrg)
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!org) return <div className="text-muted-foreground">Organization not found.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Edit Organization</h1>
      <OrgForm org={org} />
    </div>
  );
}
