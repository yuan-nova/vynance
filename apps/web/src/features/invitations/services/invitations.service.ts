import {
  type CreatedInvitation,
  createdInvitationSchema,
  type Invitation,
  type InvitationPreview,
  invitationPreviewSchema,
  invitationSchema,
} from "@vynance/shared"
import { z } from "zod"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const b = api.books[":bookId"].invitations

export async function fetchInvitations(bookId: string): Promise<Invitation[]> {
  const res = await b.$get({ param: { bookId } })
  await ensureOk(res)
  return z.array(invitationSchema).parse((await res.json()).data)
}

export async function createInvitation(bookId: string): Promise<CreatedInvitation> {
  const res = await b.$post({ param: { bookId } })
  await ensureOk(res)
  return createdInvitationSchema.parse((await res.json()).data)
}

export async function revokeInvitation(bookId: string, id: string): Promise<void> {
  const res = await b[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}

export async function fetchInvitationPreview(token: string): Promise<InvitationPreview> {
  const res = await api.invitations[":token"].$get({ param: { token } })
  await ensureOk(res)
  return invitationPreviewSchema.parse((await res.json()).data)
}

export async function acceptInvitation(token: string): Promise<{ bookId: string }> {
  const res = await api.invitations[":token"].accept.$post({ param: { token } })
  await ensureOk(res)
  return z.object({ bookId: z.string() }).parse((await res.json()).data)
}
