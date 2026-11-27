import { useNavigate } from "@tanstack/react-router"
import { LOCALE_LABEL, LOCALES, type Locale, THEME_PREFS, type ThemePref, type UpdateMeInput } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { Skeleton } from "@/components/States"
import { Switch } from "@/components/Switch"
import { TextField } from "@/components/TextField"
import { TopBar } from "@/components/TopBar"
import { useMe, useUpdateMe } from "@/features/auth"
import { useT } from "@/lib/hooks/useT"
import { showSnackbar } from "@/lib/snackbar"

/** Pengaturan (FR-150): mode privasi, tema, bahasa, nama. Berlaku di semua buku; disimpan lewat PATCH /me. */
export function SettingsPage() {
  const navigate = useNavigate()
  const t = useT()
  const me = useMe().data
  const update = useUpdateMe()
  const [name, setName] = useState<string | null>(null)

  const save = (input: UpdateMeInput, done?: string) =>
    update.mutate(input, {
      onSuccess: () => {
        if (done) showSnackbar(done)
      },
      onError: () => showSnackbar(t("settings.failed"), { tone: "error" }),
    })

  const submitName = (e: FormEvent) => {
    e.preventDefault()
    const v = (name ?? "").trim()
    if (!v || v === me?.name) return
    save({ name: v }, t("settings.saved"))
    setName(null)
  }

  const themeOptions = THEME_PREFS.map((v) => ({ value: v, label: t(`settings.theme.${v}`) }))
  const localeOptions = LOCALES.map((v) => ({ value: v, label: LOCALE_LABEL[v] }))

  return (
    <>
      <TopBar
        level={2}
        title={t("settings.title")}
        backLabel={t("settings.back")}
        onBack={() => void navigate({ to: "/lainnya" })}
      />
      {!me ? <Skeleton rows={3} /> : null}
      {me ? (
        <>
          <section className="section" aria-labelledby="set-display">
            <h2 id="set-display" className="h2">
              {t("settings.display")}
            </h2>
            <div className="card">
              <Switch
                label={t("settings.privacy")}
                hint={t("settings.privacyHint")}
                checked={me.privacyMode}
                onChange={(privacyMode) => save({ privacyMode })}
              />
              <ChipGroup<ThemePref>
                label={t("settings.theme")}
                options={themeOptions}
                value={me.theme}
                onChange={(theme) => save({ theme })}
              />
              <ChipGroup<Locale>
                label={t("settings.language")}
                options={localeOptions}
                value={me.locale}
                onChange={(locale) => save({ locale })}
              />
            </div>
          </section>

          <section className="section" aria-labelledby="set-account">
            <h2 id="set-account" className="h2">
              {t("settings.account")}
            </h2>
            <form className="card" onSubmit={submitName} noValidate>
              <TextField
                label={t("settings.name")}
                value={name ?? me.name}
                maxLength={120}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
              <TextField label={t("settings.email")} value={me.email} readOnly />
              {name !== null && name.trim() && name.trim() !== me.name ? (
                <Button type="submit" full loading={update.isPending}>
                  {t("settings.save")}
                </Button>
              ) : null}
            </form>
          </section>
        </>
      ) : null}
    </>
  )
}
