import { zValidator } from "@hono/zod-validator"
import {
  categoryListQuerySchema,
  createCategorySchema,
  idSchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { CategoriesService } from "./categories.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/categories` (FR-30). */
export const categoryRoutes = (svc: CategoriesService) =>
  new Hono<AppEnv>()
    .get("/", zValidator("query", categoryListQuerySchema, validationHook), async (c) =>
      ok(c, await svc.list(c.var.ctx, c.req.valid("query"))),
    )
    .post("/", zValidator("json", createCategorySchema, validationHook), async (c) =>
      created(c, await svc.create(c.var.ctx, c.req.valid("json"))),
    )
    .put("/order", zValidator("json", reorderCategoriesSchema, validationHook), async (c) =>
      ok(c, await svc.reorder(c.var.ctx, c.req.valid("json"))),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateCategorySchema, validationHook),
      async (c) => ok(c, await svc.update(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.remove(c.var.ctx, c.req.valid("param").id)),
    )
    .post("/:id/restore", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.restore(c.var.ctx, c.req.valid("param").id)),
    )
