import type { AppType } from "@vynance/api/app"
import { hc } from "hono/client"

// Satu origin lewat nginx (/api) atau proxy Vite, jadi base URL cukup "/".
export const api = hc<AppType>("/").api.v1
