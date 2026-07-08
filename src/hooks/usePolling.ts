import { useEffect, useRef } from "react";

export function usePolling(fn: () => void, intervalMs: number = 8000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    fnRef.current();
    const id = window.setInterval(() => fnRef.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}
