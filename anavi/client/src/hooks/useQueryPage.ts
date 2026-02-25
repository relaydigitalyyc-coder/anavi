import { UseQueryResult } from "@tanstack/react-query";

/**
 * Standard states for data-backed pages: loading, error, empty, ready.
 * Use with trpc.*.useQuery to avoid repeating loading/error handling.
 */
export function useQueryPage<T>(query: UseQueryResult<T | undefined>) {
  const { data, isLoading, isError, error } = query;
  const isEmpty = !isLoading && !isError && (data == null || (Array.isArray(data) && data.length === 0));
  const isReady = !isLoading && !isError && !isEmpty;
  return { data, isLoading, isError, error, isEmpty, isReady };
}
