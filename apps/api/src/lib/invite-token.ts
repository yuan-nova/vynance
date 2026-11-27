// Token undangan (TSD §5.4): 32 byte acak, base64url di tautan; DB hanya menyimpan SHA-256 hex.

export function newInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(bytes).toString("base64url")
}

export async function hashInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Buffer.from(digest).toString("hex")
}
