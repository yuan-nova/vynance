import { type BookSettings, bookSettingsSchema, type NotificationList, notificationListSchema } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const b = api.books[":bookId"]

export async function fetchNotifications(bookId: string): Promise<NotificationList> {
  const res = await b.notifications.$get({ param: { bookId } })
  await ensureOk(res)
  return notificationListSchema.parse((await res.json()).data)
}

export async function readAllNotifications(bookId: string): Promise<void> {
  const res = await b.notifications["read-all"].$post({ param: { bookId } })
  await ensureOk(res)
}

export async function fetchBookSettings(bookId: string): Promise<BookSettings> {
  const res = await b.settings.$get({ param: { bookId } })
  await ensureOk(res)
  return bookSettingsSchema.parse((await res.json()).data)
}

export async function saveBookSettings(bookId: string, input: BookSettings): Promise<BookSettings> {
  const res = await b.settings.$patch({ param: { bookId }, json: input })
  await ensureOk(res)
  return bookSettingsSchema.parse((await res.json()).data)
}
