import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Sheet } from "@/components/Sheet"
import { EmailOtpForm, useAuthProviders, useGoogleSignIn } from "@/features/auth"
import { showSnackbar } from "@/lib/snackbar"

const route = getRouteApi("/masuk")

/** Layar Masuk (design/02a-login.svg, FR-01). Tanpa bottom nav (DS-NAV-01 pengecualian). */
export function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = route.useSearch()
  const providers = useAuthProviders()
  const google = useGoogleSignIn()
  const [emailOpen, setEmailOpen] = useState(false)

  const done = () => {
    setEmailOpen(false)
    void navigate({ to: redirect ?? "/" })
  }

  return (
    <main className="login">
      <div className="login-brand">
        <span className="tile tile-pri">
          <Icon name="book" />
        </span>
        <span className="login-name">Vynance</span>
      </div>
      <div className="login-copy">
        <h1 className="login-title">Keuangan keluarga, satu tempat.</h1>
        <p className="body">Catat, atur anggaran, dan pantau target keluarga.</p>
      </div>
      <div className="stack">
        {providers.data?.google ? (
          <Button
            variant="dark"
            full
            loading={google.isPending}
            onClick={() => google.mutate(undefined, { onError: (e) => showSnackbar(e.message, { tone: "error" }) })}
          >
            Lanjut dengan Google
          </Button>
        ) : null}
        <Button variant={providers.data?.google ? "ghost" : "dark"} full onClick={() => setEmailOpen(true)}>
          Masuk dengan email
        </Button>
        <p className="login-note">
          <Icon name="lock" size={16} />
          Data hanya terlihat oleh kamu &amp; anggota yang diundang
        </p>
      </div>
      <Sheet open={emailOpen} title="Masuk dengan email" onClose={() => setEmailOpen(false)}>
        <EmailOtpForm onSignedIn={done} onCancel={() => setEmailOpen(false)} />
      </Sheet>
    </main>
  )
}
