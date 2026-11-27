import { createDb } from "@vynance/db"
import { env } from "../config/env"

export const db = createDb(env.DATABASE_URL)
