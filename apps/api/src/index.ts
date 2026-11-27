import { createApp } from "./app"
import { env } from "./config/env"
import { container } from "./container"

const app = createApp(container)

export default { port: env.PORT, hostname: "0.0.0.0", fetch: app.fetch }
