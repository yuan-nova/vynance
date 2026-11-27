import type { ServiceCtx } from "@vynance/shared"

/** Variabel konteks Hono yang dipasang middleware auth dan bookAccess. */
export type AppEnv = {
  // biome-ignore lint/style/useNamingConvention: nama key ditentukan Hono
  Variables: {
    userId: string
    ctx: ServiceCtx
  }
}
