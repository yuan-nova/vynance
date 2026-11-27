import { queryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { Health } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchHealth } from "../services/health.service"

export const apiHealthQueryOptions = () =>
  queryOptions({ queryKey: qk.health(), queryFn: fetchHealth, refetchInterval: 15_000 })

export function useApiHealth(): UseQueryResult<Health> {
  return useQuery(apiHealthQueryOptions())
}
