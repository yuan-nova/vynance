import {
  type CreateSubscriptionInput,
  type FxRates,
  fxRatesSchema,
  type Subscription,
  type SubscriptionList,
  subscriptionListSchema,
  subscriptionSchema,
  type UpdateSubscriptionInput,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const s = api.books[":bookId"].subscriptions

export async function fetchSubscriptions(bookId: string): Promise<SubscriptionList> {
  const res = await s.$get({ param: { bookId } })
  await ensureOk(res)
  return subscriptionListSchema.parse((await res.json()).data)
}

export async function fetchFxRates(bookId: string): Promise<FxRates> {
  const res = await s.rates.$get({ param: { bookId } })
  await ensureOk(res)
  return fxRatesSchema.parse((await res.json()).data)
}

export async function createSubscription(bookId: string, input: CreateSubscriptionInput): Promise<Subscription> {
  const res = await s.$post({ param: { bookId }, json: input })
  await ensureOk(res)
  return subscriptionSchema.parse((await res.json()).data)
}

export async function updateSubscription(
  bookId: string,
  id: string,
  input: UpdateSubscriptionInput,
): Promise<Subscription> {
  const res = await s[":id"].$put({ param: { bookId, id }, json: input })
  await ensureOk(res)
  return subscriptionSchema.parse((await res.json()).data)
}

export async function deleteSubscription(bookId: string, id: string): Promise<void> {
  const res = await s[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}
