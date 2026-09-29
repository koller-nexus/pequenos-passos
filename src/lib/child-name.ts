export const CHILD_NAME_KEY = "pequenos-passos:child-name:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function normalizeChildName(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export function readChildName(storage: StorageLike): string {
  try {
    return normalizeChildName(storage.getItem(CHILD_NAME_KEY));
  } catch {
    return "";
  }
}

export function writeChildName(storage: StorageLike, value: string): void {
  try {
    storage.setItem(CHILD_NAME_KEY, value.slice(0, 80));
  } catch {
    // The name input remains usable when storage is unavailable.
  }
}
