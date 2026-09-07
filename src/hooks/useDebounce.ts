import { useState, useEffect } from 'react';

/**
 * Hook to debounce any fast-changing value (e.g. search input, txHash)
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default 500ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
