"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useActiveOrg } from "@/lib/active-org-context";
import { hasUnpublishedChanges, getDeliveryConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";

/**
 * "Publish to site" — content edits don't auto-build; clicking this enqueues ONE site
 * rebuild (Astro) / cache-bust (WP). Shows whether there are unpublished changes.
 */
export function PublishButton() {
  const { activeOrg } = useActiveOrg();
  const [publishing, setPublishing] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  const dirty = hasUnpublishedChanges(activeOrg) && !justPublished;
  const lastPublishedAt = getDeliveryConfig(activeOrg).lastPublishedAt;

  async function publish() {
    setPublishing(true);
    try {
      await api.post("/api/v1/delivery-jobs/publish");
      setJustPublished(true);
      toast.success("Publishing — your site will rebuild shortly (see Delivery for status).");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {dirty ? (
        <span className="text-sm font-medium text-amber-600">Unpublished changes</span>
      ) : justPublished ? (
        <span className="text-sm text-muted-foreground">Publishing…</span>
      ) : lastPublishedAt ? (
        <span className="text-sm text-muted-foreground">
          Published {new Date(lastPublishedAt).toLocaleString()}
        </span>
      ) : null}
      <Button
        onClick={publish}
        disabled={publishing}
        variant={dirty ? "default" : "outline"}
        title="Trigger a site rebuild now"
      >
        <UploadCloud className="mr-2 size-4" />
        {publishing ? "Publishing…" : "Publish to site"}
      </Button>
    </div>
  );
}
