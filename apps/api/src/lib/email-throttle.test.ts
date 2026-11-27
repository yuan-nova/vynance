import { describe, expect, test } from "bun:test"
import { createEmailThrottle } from "./email-throttle"

describe("createEmailThrottle", () => {
  test("menolak setelah batas, per email, dan pulih setelah jendela", () => {
    let t = 0
    const th = createEmailThrottle(2, 1000, () => t)
    expect(th.allow("A@x.id")).toBe(true)
    expect(th.allow("a@x.id")).toBe(true)
    expect(th.allow("a@x.id")).toBe(false)
    expect(th.allow("b@x.id")).toBe(true)
    t = 1001
    expect(th.allow("a@x.id")).toBe(true)
  })
})
