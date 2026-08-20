import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity. Use it to keep an input responsive (the raw state drives the
 * field) while expensive filtering/derivation runs off the debounced copy.
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * const rows = useMemo(() => filter(list, debouncedSearch), [list, debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Pairs the raw input value with its debounced counterpart so a component can
 * bind the field to `value` and filter on `debouncedValue` in one call.
 */
export function useDebouncedSearch(initial = "", delay = 300) {
  const [value, setValue] = useState(initial);
  const debouncedValue = useDebounce(value, delay);
  return { value, setValue, debouncedValue };
}

/**
 * Returns a stable function that defers invoking `fn` until `delay` ms have
 * passed without another call. The latest arguments win. The timer is cleared
 * on unmount so a pending call can't fire against a dead component.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 300) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    (...args: A) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
