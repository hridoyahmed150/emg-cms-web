"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useActiveOrg } from "@/lib/active-org-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { selectClass } from "@/components/meta-fields";
import type { Organization, ReviewsConfig } from "@/lib/types";

// Modules this org can use; unchecked → hidden from the dashboard + blocked in the API.
const FEATURE_MODULES = [
  { key: "jobs", label: "Jobs" },
  { key: "reviews", label: "Reviews" },
];

function parseJson(label: string, val: string): unknown {
  try {
    return JSON.parse(val || "{}");
  } catch {
    throw new Error(`Invalid JSON in "${label}"`);
  }
}

export function OrgForm({ org }: { org?: Organization }) {
  const router = useRouter();
  const { refreshOrgs } = useActiveOrg();

  // Split config: `reviews` is managed by the structured section below; the rest
  // (buildHookUrl, cacheBustUrl, …) stays in the raw JSON textarea.
  const initialConfig = (org?.config ?? {}) as Record<string, unknown>;
  const { reviews: initialReviews, ...restConfig } = initialConfig;
  const rv = (initialReviews ?? {}) as ReviewsConfig;

  const [slug, setSlug] = useState(org?.slug ?? "");
  const [name, setName] = useState(org?.name ?? "");
  const [deliveryTarget, setDeliveryTarget] = useState(org?.deliveryTarget ?? "ASTRO_PULL");
  const [config, setConfig] = useState(JSON.stringify(restConfig, null, 2));
  const [features, setFeatures] = useState<Record<string, boolean>>(
    (org?.features as Record<string, boolean> | undefined) ?? { jobs: true, reviews: true },
  );
  const [customFields, setCustomFields] = useState(JSON.stringify(org?.customFields ?? {}, null, 2));

  // Structured reviews source.
  const [rvSource, setRvSource] = useState<NonNullable<ReviewsConfig["source"]>>(rv.source ?? "manual");
  const [rvPlaceId, setRvPlaceId] = useState(rv.placeId ?? "");
  const [rvMapsUrl, setRvMapsUrl] = useState(rv.googleMapsUrl ?? "");
  const [rvGbpAccount, setRvGbpAccount] = useState(rv.gbpAccountId ?? "");
  const [rvGbpLocation, setRvGbpLocation] = useState(rv.gbpLocationId ?? "");
  const [rvMinRating, setRvMinRating] = useState(String(rv.minRating ?? 5));
  const [rvLimit, setRvLimit] = useState(String(rv.limit ?? 20));
  const [rvSyncDays, setRvSyncDays] = useState(String(rv.syncEveryDays ?? 15));

  const [saving, setSaving] = useState(false);

  function buildReviewsConfig(): Record<string, unknown> {
    const reviews: Record<string, unknown> = {
      source: rvSource,
      minRating: Number(rvMinRating) || 5,
      limit: Number(rvLimit) || 20,
      syncEveryDays: Number(rvSyncDays) || 15,
    };
    if (rvPlaceId.trim()) reviews.placeId = rvPlaceId.trim();
    if (rvMapsUrl.trim()) reviews.googleMapsUrl = rvMapsUrl.trim();
    if (rvGbpAccount.trim()) reviews.gbpAccountId = rvGbpAccount.trim();
    if (rvGbpLocation.trim()) reviews.gbpLocationId = rvGbpLocation.trim();
    // Preserve server-managed values the form doesn't edit.
    if (rv.lastRefreshedAt != null) reviews.lastRefreshedAt = rv.lastRefreshedAt;
    const enc = (initialReviews as Record<string, unknown> | undefined)?.gbpRefreshTokenEncrypted;
    if (enc) reviews.gbpRefreshTokenEncrypted = enc;
    return reviews;
  }

  async function submit() {
    setSaving(true);
    try {
      const parsedConfig = parseJson("Config", config) as Record<string, unknown>;
      const body = {
        name,
        deliveryTarget,
        config: { ...parsedConfig, reviews: buildReviewsConfig() },
        features,
        customFields: parseJson("Custom fields", customFields),
      };
      if (org) await api.patch(`/api/v1/organizations/${org.id}`, body);
      else await api.post("/api/v1/organizations", { ...body, slug });
      toast.success(org ? "Organization updated" : "Organization created");
      await refreshOrgs(); // update the Topbar switcher list without a full reload
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

      {/* Structured reviews source */}
      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div>
          <p className="text-sm font-medium">Reviews source</p>
          <p className="text-xs text-muted-foreground">
            How this org&apos;s Google reviews are refreshed. Public feed shows {rvMinRating}★+ , latest {rvLimit}.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Source</Label>
          <select
            className={selectClass}
            value={rvSource}
            onChange={(e) => setRvSource(e.target.value as NonNullable<ReviewsConfig["source"]>)}
          >
            <option value="manual">manual — import / paste only</option>
            <option value="places">places — Google Places API (≤5 per refresh)</option>
            <option value="gbp">gbp — Google Business Profile (all reviews)</option>
          </select>
        </div>

        {rvSource === "places" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Place ID</Label>
              <Input placeholder="ChIJ…" value={rvPlaceId} onChange={(e) => setRvPlaceId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Google Maps URL (optional)</Label>
              <Input
                placeholder="https://maps.app.goo.gl/…"
                value={rvMapsUrl}
                onChange={(e) => setRvMapsUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {rvSource === "gbp" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>GBP account id</Label>
              <Input value={rvGbpAccount} onChange={(e) => setRvGbpAccount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GBP location id</Label>
              <Input value={rvGbpLocation} onChange={(e) => setRvGbpLocation(e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Min rating</Label>
            <Input type="number" min={1} max={5} value={rvMinRating} onChange={(e) => setRvMinRating(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Display limit</Label>
            <Input type="number" min={1} max={100} value={rvLimit} onChange={(e) => setRvLimit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Refresh every (days)</Label>
            <Input type="number" min={1} value={rvSyncDays} onChange={(e) => setRvSyncDays(e.target.value)} />
          </div>
        </div>
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
          {" · "}reviews is managed above.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Modules</Label>
        <div className="flex flex-wrap gap-5 rounded-lg border p-3">
          {FEATURE_MODULES.map((m) => (
            <label key={m.key} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={features[m.key] !== false}
                onCheckedChange={(v) => setFeatures((f) => ({ ...f, [m.key]: v === true }))}
              />
              {m.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Unchecked modules are hidden from this org&apos;s dashboard menu and blocked in the API.
        </p>
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
