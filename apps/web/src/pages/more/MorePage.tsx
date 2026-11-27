import { Link, useNavigate } from "@tanstack/react-router"
import { MORE_MENU } from "@vynance/shared"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { TopBar } from "@/components/TopBar"
import { useSignOut } from "@/features/auth"
import { showSnackbar } from "@/lib/snackbar"

/** Menu Lainnya: kisi bergrup, ≤ 4 kolom, label di bawah ikon (DS-NAV-03). */
export function MorePage() {
  const navigate = useNavigate()
  const signOut = useSignOut()
  return (
    <>
      <TopBar level={1} title="Lainnya" />
      {MORE_MENU.map((g) => (
        <section key={g.title} className="section" aria-labelledby={`more-${g.title}`}>
          <h2 id={`more-${g.title}`} className="h2">
            {g.title}
          </h2>
          <ul className="menu-grid">
            {g.items.map((it) => (
              <li key={it.key}>
                {it.path ? (
                  <Link to={it.path} className="menu-item">
                    <span className="tile tile-pri">
                      <Icon name={it.icon} size={19} />
                    </span>
                    <span className="menu-label">{it.label}</span>
                  </Link>
                ) : (
                  <span className="menu-item menu-item-off" aria-disabled="true">
                    <span className="tile tile-neutral">
                      <Icon name={it.icon} size={19} />
                    </span>
                    <span className="menu-label">{it.label}</span>
                    <span className="menu-soon">Segera hadir</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="section">
        <Button
          variant="ghost"
          full
          icon="logout"
          loading={signOut.isPending}
          onClick={() =>
            signOut.mutate(undefined, {
              onSuccess: () => void navigate({ to: "/masuk" }),
              onError: (e) => showSnackbar(e.message, { tone: "error" }),
            })
          }
        >
          Keluar
        </Button>
      </section>
    </>
  )
}
