export type Role = "SUPER_ADMIN" | "ADMIN";
export type DeliveryTarget = "ASTRO_PULL" | "WORDPRESS_PULL";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  organizationId: number | null;
  createdAt?: string;
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
