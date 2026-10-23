import { useEffect, useState } from "react";

// Start with the same value on the server and browser, then read device data.
export function useStoredValue<T>(read: () => T, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const refresh = () => setValue(read());
    refresh();
    window.addEventListener("sqp-store-change", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("sqp-store-change", refresh); window.removeEventListener("storage", refresh); };
  }, [read]);
  return [value, setValue] as const;
}