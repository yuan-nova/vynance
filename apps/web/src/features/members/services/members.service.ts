import { type Activity, activitySchema, type Member, memberSchema } from "@vynance/shared"
import { z } from "zod"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const b = api.books[":bookId"]

export async function fetchMembers(bookId: string): Promise<Member[]> {
  const res = await b.members.$get({ param: { bookId } })
  await ensureOk(res)
  return z.array(memberSchema).parse((await res.json()).data)
}

export async function removeMember(bookId: string, userId: string): Promise<void> {
  const res = await b.members[":userId"].$delete({ param: { bookId, userId } })
  await ensureOk(res)
}

export async function leaveBook(bookId: string): Promise<void> {
  const res = await b.leave.$post({ param: { bookId } })
  await ensureOk(res)
}

export async function fetchActivities(bookId: string, limit = 10): Promise<Activity[]> {
  const res = await b.activities.$get({ param: { bookId }, query: { limit: String(limit) } })
  await ensureOk(res)
  return z.array(activitySchema).parse((await res.json()).data)
}
