export const browserStorage = {
  read<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "null");
      if (
        value === null ||
        typeof value !== "object" ||
        (Array.isArray(fallback) && !Array.isArray(value))
      )
        return fallback;
      return value as T;
    } catch {
      return fallback;
    }
  },
  write(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Blocked browser storage must not prevent local/demo navigation.
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Reset also works when browser persistence is unavailable.
    }
  },
};
