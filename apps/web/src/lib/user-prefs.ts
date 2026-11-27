import type { Me } from "@vynance/shared"
import { localeStore } from "./i18n"
import { privacyStore } from "./privacy"

/** Terapkan preferensi profil ke UI: mode privasi (BR-44), tema (DS-THEME-01), bahasa (FR-150). */
export function applyUserPrefs(me: Pick<Me, "privacyMode" | "theme" | "locale">): void {
  privacyStore.set(me.privacyMode)
  localeStore.set(me.locale)
  const root = document.documentElement
  root.lang = me.locale
  if (me.theme === "system") delete root.dataset.theme
  else root.dataset.theme = me.theme
}
