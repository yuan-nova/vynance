import { useSyncExternalStore } from "react"
import { privacyStore } from "../privacy"

export function usePrivacyMode(): boolean {
  return useSyncExternalStore(privacyStore.subscribe, privacyStore.get, privacyStore.get)
}
