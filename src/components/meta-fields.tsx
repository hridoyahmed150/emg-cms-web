"use client";

import type { Control, ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { FieldDef } from "@/lib/types";

export const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

type Field = ControllerRenderProps<FieldValues, string>;

function Control({ def, field }: { def: FieldDef; field: Field }) {
  switch (def.type) {
    case "enum":
      return (
        <select
          className={selectClass}
          value={(field.value as string) ?? ""}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          name={field.name}
        >
          {!def.required && <option value="">—</option>}
          {(def.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "boolean":
      return (
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={Boolean(field.value)}
            onChange={(e) => field.onChange(e.target.checked)}
            name={field.name}
          />
          <span className="text-sm text-muted-foreground">Enabled</span>
        </label>
      );
    case "number":
      return (
        <Input
          type="number"
          value={field.value === undefined || field.value === null ? "" : String(field.value)}
          onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          onBlur={field.onBlur}
          name={field.name}
        />
      );
    case "url":
      return <Input type="url" placeholder="https://…" {...field} value={(field.value as string) ?? ""} />;
    default:
      return <Input {...field} value={(field.value as string) ?? ""} />;
  }
}

/** Render an organization's custom (hybrid `meta`) fields, bound to react-hook-form. */
export function MetaFields({ control, defs }: { control: Control<FieldValues>; defs: FieldDef[] }) {
  if (!defs.length) return null;
  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <p className="text-sm font-medium text-muted-foreground">Custom fields</p>
      {defs.map((def) => (
        <FormField
          key={def.key}
          control={control}
          name={`meta.${def.key}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {def.label}
                {def.required ? " *" : ""}
              </FormLabel>
              <Control def={def} field={field} />
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}

/** Build react-hook-form default values for an org's meta fields. */
export function metaDefaults(
  defs: FieldDef[],
  existing?: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of defs) {
    out[d.key] = existing?.[d.key] ?? (d.type === "boolean" ? false : "");
  }
  return out;
}
