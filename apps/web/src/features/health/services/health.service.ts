import { type Health, healthSchema } from "@vynance/shared"
import { api } from "@/lib/api-client"

export async function fetchHealth(): Promise<Health> {
  const res = await api.health.$get()
  if (!res.ok) throw new Error(`API health ${res.status}`)
  const body = await res.json()
  return healthSchema.parse(body.data)
}
