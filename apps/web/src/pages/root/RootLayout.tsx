import { Outlet } from "@tanstack/react-router"
import { SnackbarHost } from "@/components/SnackbarHost"

export function RootLayout() {
  return (
    <>
      <Outlet />
      <SnackbarHost />
    </>
  )
}
