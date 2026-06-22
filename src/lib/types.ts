export type Role = "SUPER_ADMIN" | "ADMIN";
export type DeliveryTarget = "ASTRO_PULL" | "WORDPRESS_PULL";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  organizationId: number | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

/** Read-only permission metadata from GET /api/v1/meta/permissions. */
export interface PermissionInfo {
  key: string;
  label: string;
  group: string;
}
export interface PermissionsMeta {
  roles: Record<Role, string[]>;
  catalog: PermissionInfo[];
}

export interface Organization {
  id: number;
  slug: string;
  name: string;
  deliveryTarget: DeliveryTarget;
  config: Record<string, unknown>;
  features: Record<string, boolean>;
  customFields: CustomFields;
  createdAt: string;
}

/** Per-organization Google reviews config, stored at `Organization.config.reviews`. */
export interface ReviewsConfig {
  source?: "manual" | "places" | "gbp";
  placeId?: string;
  googleMapsUrl?: string;
  gbpAccountId?: string;
  gbpLocationId?: string;
  minRating?: number;
  limit?: number;
  syncEveryDays?: number;
  lastRefreshedAt?: number;
}

/** Read `config.reviews` off an organization (config is loosely typed JSON). */
export function getReviewsConfig(org?: Organization | null): ReviewsConfig {
  const reviews = (org?.config as Record<string, unknown> | undefined)?.reviews;
  return reviews && typeof reviews === "object" ? (reviews as ReviewsConfig) : {};
}

/** Astro publish target stored at `Organization.config.git` (Bitbucket repo for commit-on-publish). */
export interface GitConfig {
  repo?: string;
  branch?: string;
  path?: string; // reviews.json repo path
  jobsPath?: string; // jobs.json repo path
}

export function getGitConfig(org?: Organization | null): GitConfig {
  const git = (org?.config as Record<string, unknown> | undefined)?.git;
  return git && typeof git === "object" ? (git as GitConfig) : {};
}

/** Publish state stored at `Organization.config.delivery` (drives "unpublished changes"). */
export interface DeliveryConfig {
  lastContentChangeAt?: number;
  lastPublishedAt?: number;
}

export function getDeliveryConfig(org?: Organization | null): DeliveryConfig {
  const d = (org?.config as Record<string, unknown> | undefined)?.delivery;
  return d && typeof d === "object" ? (d as DeliveryConfig) : {};
}

/** True when content changed after the last publish (i.e. site is out of date). */
export function hasUnpublishedChanges(org?: Organization | null): boolean {
  const d = getDeliveryConfig(org);
  return (d.lastContentChangeAt ?? 0) > (d.lastPublishedAt ?? 0);
}

/**
 * Whether an org has a module (jobs/reviews/…) enabled. ENABLED unless explicitly set
 * to false, so legacy orgs (and a null/unknown org) default to on. Mirrors the API's
 * requireFeature guard.
 */
export function isFeatureEnabled(org: Organization | null | undefined, feature: string): boolean {
  const features = (org?.features ?? {}) as Record<string, boolean>;
  return features[feature] !== false;
}

export type FieldType = "string" | "number" | "boolean" | "enum" | "url";
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}
export type CustomFields = Record<string, FieldDef[]>;

export interface Job {
  id: number;
  organizationId: number;
  slug: string;
  title: string;
  type: string;
  location: string;
  posted: string;
  status: "active" | "expired" | "draft";
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  organizationId: number;
  name: string;
  avatar: string | null;
  rating: number;
  text: string;
  time: number;
  featured: boolean;
  verified: boolean;
  reviewUrl: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiToken {
  id: number;
  type: "USER" | "CONSUMER";
  name: string;
  scopes: string[];
  organizationId: number | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface DeliveryJob {
  id: number;
  organizationId: number;
  collection: string;
  status: "pending" | "running" | "success" | "failed";
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  result: string | null;
  error: string | null;
  attempts: number;
}
