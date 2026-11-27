import { useSnackbar } from "@/lib/hooks/useSnackbar"
import { snackbarStore } from "@/lib/snackbar"

/** Wadah snackbar di atas bottom nav, diumumkan lewat aria-live (DS-STATE-03). */
export function SnackbarHost() {
  const item = useSnackbar()
  return (
    <div className="snackbar-host" aria-live={item?.tone === "error" ? "assertive" : "polite"} role="status">
      {item ? (
        <div className={`snackbar${item.tone === "error" ? " snackbar-error" : ""}`}>
          <span>{item.message}</span>
          {item.actionLabel && item.onAction ? (
            <button
              type="button"
              className="snackbar-action"
              onClick={() => {
                item.onAction?.()
                snackbarStore.dismiss(item.id)
              }}
            >
              {item.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
