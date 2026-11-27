import { useNavigate } from "@tanstack/react-router"
import { LOCALE_LABEL, LOCALES, type Locale, THEME_PREFS, type ThemePref, type UpdateMeInput } from "@vynance/shared"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { Icon } from "@/components/Icon"
import { Sheet } from "@/components/Sheet"
import { ErrorState, Skeleton } from "@/components/States"
import { Switch } from "@/components/Switch"
import { TextField } from "@/components/TextField"
import { TopBar } from "@/components/TopBar"
import { DeleteAccountForm, exportUrl, useDeleteAccount, useDeletionPreview } from "@/features/account"
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
  const [deleting, setDeleting] = useState(false)
  const preview = useDeletionPreview(deleting)
  const remove = useDeleteAccount()

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

          <section className="section" aria-labelledby="set-data">
            <h2 id="set-data" className="h2">
              {t("settings.data")}
            </h2>
            <div className="card plain-list">
              <a className="row row-btn" href={exportUrl("json")} download>
                <span className="tile tile-pri" aria-hidden="true">
                  <Icon name="download" />
                </span>
                <span className="row-main">
                  <span className="row-title">{t("settings.exportJson")}</span>
                  <span className="row-sub">{t("settings.exportJsonHint")}</span>
                </span>
              </a>
              <a className="row row-btn" href={exportUrl("csv")} download>
                <span className="tile tile-pri" aria-hidden="true">
                  <Icon name="doc" />
                </span>
                <span className="row-main">
                  <span className="row-title">{t("settings.exportCsv")}</span>
                  <span className="row-sub">{t("settings.exportCsvHint")}</span>
                </span>
              </a>
            </div>
            <Button variant="ghost" full icon="trash" onClick={() => setDeleting(true)}>
              {t("settings.deleteAccount")}
            </Button>
          </section>

          <Sheet open={deleting} title={t("settings.deleteAccount")} onClose={() => setDeleting(false)}>
            {preview.isPending ? <Skeleton rows={2} /> : null}
            {preview.isError ? (
              <ErrorState
                message="Data akun gagal dimuat."
                onRetry={() => void preview.refetch()}
                retrying={preview.isFetching}
              />
            ) : null}
            {preview.data ? (
              <DeleteAccountForm
                email={me.email}
                preview={preview.data}
                pending={remove.isPending}
                onCancel={() => setDeleting(false)}
                onSubmit={(confirmEmail, onError) =>
                  remove.mutate(confirmEmail, {
                    onSuccess: () => {
                      showSnackbar(t("settings.deleted"))
                      void navigate({ to: "/masuk" })
                    },
                    onError,
                  })
                }
              />
            ) : null}
          </Sheet>
        </>
      ) : null}
    </>
  )
}
