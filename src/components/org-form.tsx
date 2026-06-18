"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { selectClass } from "@/components/meta-fields";
import type { Organization } from "@/lib/types";

function parseJson(label: string, val: string): unknown {
  try {
    return JSON.parse(val || "{}");
  } catch {
    throw new Error(`Invalid JSON in "${label}"`);
  }
}

export function OrgForm({ org }: { org?: Organization }) {
  const router = useRouter();
  const [slug, setSlug] = useState(org?.slug ?? "");
  const [name, setName] = useState(org?.name ?? "");
  const [deliveryTarget, setDeliveryTarget] = useState(org?.deliveryTarget ?? "ASTRO_PULL");
  const [config, setConfig] = useState(JSON.stringify(org?.config ?? {}, null, 2));
  const [features, setFeatures] = useState(JSON.stringify(org?.features ?? { jobs: true, reviews: true }, null, 2));
  const [customFields, setCustomFields] = useState(JSON.stringify(org?.customFields ?? {}, null, 2));
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const body = {
        name,
        deliveryTarget,
        config: parseJson("Config", config),
        features: parseJson("Features", features),
        customFields: parseJson("Custom fields", customFields),
      };
      if (org) await api.patch(`/api/v1/organizations/${org.id}`, body);
      else await api.post("/api/v1/organizations", { ...body, slug });
      toast.success(org ? "Organization updated" : "Organization created");
      router.push("/organizations");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            placeholder="acme-corp"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={Boolean(org)}
          />
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Delivery target</Label>
        <select
          className={selectClass}
          value={deliveryTarget}
          onChange={(e) => setDeliveryTarget(e.target.value as Organization["deliveryTarget"])}
        >
          <option value="ASTRO_PULL">ASTRO_PULL</option>
          <option value="WORDPRESS_PULL">WORDPRESS_PULL</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Config (JSON)</Label>
        <Textarea
          rows={4}
          className="font-mono text-xs"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          ASTRO_PULL: {`{ "buildHookUrl": "…" }`} · WORDPRESS_PULL: {`{ "siteUrl": "…", "cacheBustUrl": "…" }`}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Features (JSON)</Label>
        <Textarea
          rows={3}
          className="font-mono text-xs"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Custom fields (JSON)</Label>
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={customFields}
          onChange={(e) => setCustomFields(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {`{ "jobs": [{ "key": "salary", "label": "Salary", "type": "string" }] }`}
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving}>
          {saving ? "Saving…" : org ? "Save changes" : "Create organization"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/organizations")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
