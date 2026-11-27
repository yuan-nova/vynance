import { createBookSchema } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"

type BookNameFormProps = {
  initial?: string
  submitLabel: string
  pending: boolean
  onSubmit: (name: string, onError: (err: unknown) => void) => void
  onCancel?: () => void
}

/** Form satu kolom nama buku (BR-47). Dipakai untuk buat dan ubah nama. */
export function BookNameForm({ initial = "", submitLabel, pending, onSubmit, onCancel }: BookNameFormProps) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | undefined>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createBookSchema.safeParse({ name })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }
    setError(undefined)
    onSubmit(parsed.data.name, (err) => {
      const { fields, formError } = splitApiError(err, ["name"] as const)
      setError(fields.name ?? formError ?? undefined)
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <TextField
        label="Nama buku"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        error={error}
        hint="Nama buku boleh sama. Kode dibuat otomatis dan selalu beda."
        autoFocus
      />
      <div className="stack">
        <Button type="submit" full loading={pending}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" full onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  )
}
