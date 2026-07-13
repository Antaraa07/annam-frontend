import { useEffect, useRef, useCallback } from "react";

export function usePolling(fn: () => void, intervalMs: number = 8000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    fnRef.current();
  }, []);
}
