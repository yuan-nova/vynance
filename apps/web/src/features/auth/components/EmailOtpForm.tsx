import { requestOtpSchema, verifyOtpSchema } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { TextField } from "@/components/TextField"
import { splitApiError } from "@/lib/api-error"
import { useRequestOtp, useVerifyOtp } from "../hooks/useAuth"

type EmailOtpFormProps = { onSignedIn: () => void; onCancel: () => void }

/** Dua langkah: email → kode 6 angka (FR-01). */
export function EmailOtpForm({ onSignedIn, onCancel }: EmailOtpFormProps) {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [errors, setErrors] = useState<{ email?: string; otp?: string; form?: string }>({})
  const request = useRequestOtp()
  const verify = useVerifyOtp()

  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    const parsed = requestOtpSchema.safeParse({ email: email.trim() })
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message })
      return
    }
    setErrors({})
    request.mutate(parsed.data.email, {
      onSuccess: () => setStep("otp"),
      onError: (err) => {
        const { fields, formError } = splitApiError(err, ["email"] as const)
        setErrors({ ...fields, form: formError ?? undefined })
      },
    })
  }

  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    const parsed = verifyOtpSchema.safeParse({ email: email.trim(), otp: otp.trim() })
    if (!parsed.success) {
      setErrors({ otp: parsed.error.issues[0]?.message })
      return
    }
    setErrors({})
    verify.mutate(parsed.data, {
      onSuccess: onSignedIn,
      onError: (err) => {
        const { fields, formError } = splitApiError(err, ["otp"] as const)
        setErrors({ ...fields, form: formError ?? undefined })
      },
    })
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} noValidate>
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus
        />
        {errors.form ? (
          <p className="field-error" role="alert">
            {errors.form}
          </p>
        ) : null}
        <div className="stack">
          <Button type="submit" full loading={request.isPending}>
            Kirim kode
          </Button>
          <Button variant="ghost" full onClick={onCancel}>
            Batal
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={submitCode} noValidate>
      <p className="body">Kode 6 angka sudah dikirim ke {email}.</p>
      <TextField
        label="Kode masuk"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        error={errors.otp}
        autoFocus
      />
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}
      <div className="stack">
        <Button type="submit" full loading={verify.isPending}>
          Masuk
        </Button>
        <Button
          variant="ghost"
          full
          onClick={() => {
            setOtp("")
            setErrors({})
            setStep("email")
          }}
        >
          Ganti email
        </Button>
      </div>
    </form>
  )
}
