// Satu-satunya tempat membuat query key (CODING-GUIDELINES §7.2 butir 2).
export const qk = {
  health: () => ["health"] as const,
  me: () => ["me"] as const,
  authProviders: () => ["auth", "providers"] as const,
}
