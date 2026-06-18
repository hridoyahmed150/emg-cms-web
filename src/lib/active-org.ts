// The org a SUPER_ADMIN is currently "viewing". Persisted so it survives reloads
// and read synchronously by the API client (to append ?orgId on every request).
const KEY = "emg_active_org";

let activeOrgId: number | null = null;
if (typeof window !== "undefined") {
  const v = window.localStorage.getItem(KEY);
  activeOrgId = v ? Number(v) : null;
}

export const getActiveOrgId = (): number | null => activeOrgId;

export function setActiveOrgId(id: number | null): void {
  activeOrgId = id;
  if (typeof window !== "undefined") {
    if (id == null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, String(id));
  }
}
