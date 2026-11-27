import type { Me } from "@vynance/shared"
import { privacyStore } from "./privacy"

/** Terapkan preferensi profil ke UI: mode privasi (BR-44) dan tema (DS-THEME-01). */
export function applyUserPrefs(me: Pick<Me, "privacyMode" | "theme">): void {
  privacyStore.set(me.privacyMode)
  const root = document.documentElement
  if (me.theme === "system") delete root.dataset.theme
  else root.dataset.theme = me.theme
}
