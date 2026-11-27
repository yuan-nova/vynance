import { ValidationError } from "./errors"

type Issue = { path: ReadonlyArray<PropertyKey> }
type HookResult = { success: true } | { success: false; error: { issues: ReadonlyArray<Issue> } }

/** Hook `zValidator`: error Zod → 422 dengan `field` pertama. */
export function validationHook(result: HookResult): void {
  if (result.success) return
  const first = result.error.issues[0]
  const field = first && first.path.length > 0 ? first.path.map(String).join(".") : undefined
  throw new ValidationError(field)
}
