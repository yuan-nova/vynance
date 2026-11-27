import { type MessageKey, translate } from "@vynance/shared"
import { useSyncExternalStore } from "react"
import { localeStore } from "../i18n"

/** Penerjemah teks antarmuka sesuai bahasa profil (FR-150). */
export function useT(): (key: MessageKey) => string {
  const locale = useSyncExternalStore(localeStore.subscribe, localeStore.get, localeStore.get)
  return (key) => translate(locale, key)
}
