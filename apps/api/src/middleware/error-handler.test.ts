import { describe, expect, test } from "bun:test"
import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { BusinessError } from "../lib/errors"
import { validationHook } from "../lib/validation"
import { errorHandler, notFoundHandler } from "./error-handler"

const app = new Hono()
  .onError(errorHandler)
  .notFound(notFoundHandler)
  .get("/boom", () => {
    throw new Error("rahasia internal")
  })
  .get("/biz", () => {
    throw new BusinessError("CONFLICT", "name", 409)
  })
  .post("/v", zValidator("json", z.object({ name: z.string().min(1), amount: z.string() }), validationHook), (c) =>
    c.json({ data: c.req.valid("json") }),
  )

describe("error-handler", () => {
  test("error tak dikenal → 500 INTERNAL tanpa detail", async () => {
    const res = await app.request("/boom")
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe("INTERNAL")
    expect(JSON.stringify(body)).not.toContain("rahasia")
  })

  test("input salah → 422 dengan field", async () => {
    const res = await app.request("/v", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "", amount: "1" }),
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: unknown }).error).toMatchObject({ code: "VALIDATION", field: "name" })
  })

  test("BusinessError membawa status dan field", async () => {
    const res = await app.request("/biz")
    expect(res.status).toBe(409)
    expect(((await res.json()) as { error: unknown }).error).toMatchObject({ code: "CONFLICT", field: "name" })
  })

  test("rute tidak ada → 404", async () => {
    const res = await app.request("/tidak-ada")
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("NOT_FOUND")
  })
})
