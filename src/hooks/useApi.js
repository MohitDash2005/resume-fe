import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useApi — generic data-fetching hook
 *
 * @param {Function} fn        — async service function to call
 * @param {Array}    deps      — dependency array (re-fetches when changed)
 * @param {*}        initial   — initial data value (default null)
 *
 * Returns: { data, loading, error, refetch }
 */
const useApi = (fn, deps = [], initial = null) => {
  const [data,    setData]    = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) {
        setError(err?.response?.data?.error || err?.message || "Something went wrong");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => {
    mounted.current = true;
    execute();
    return () => { mounted.current = false; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
};

export default useApi;
