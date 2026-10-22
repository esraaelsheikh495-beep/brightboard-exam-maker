import { useEffect, useState } from "react";

// Start with the same value on the server and browser, then read device data.
export function useStoredValue<T>(read: () => T, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => { setValue(read()); }, [read]);
  return [value, setValue] as const;
}