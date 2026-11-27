import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AuthProviders, Me, UpdateMeInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { applyUserPrefs } from "@/lib/user-prefs"
import {
  fetchAuthProviders,
  fetchMe,
  requestOtp,
  signInWithGoogle,
  signOut,
  updateMe,
  verifyOtp,
} from "../services/auth.service"

export const meQueryOptions = () => queryOptions({ queryKey: qk.me(), queryFn: fetchMe, staleTime: 60_000 })

export const authProvidersQueryOptions = () =>
  queryOptions({ queryKey: qk.authProviders(), queryFn: fetchAuthProviders, staleTime: Number.POSITIVE_INFINITY })

export function useMe(): UseQueryResult<Me | null> {
  return useQuery(meQueryOptions())
}

export function useAuthProviders(): UseQueryResult<AuthProviders> {
  return useQuery(authProvidersQueryOptions())
}

export function useRequestOtp() {
  return useMutation({ mutationFn: (email: string) => requestOtp(email) })
}

export function useVerifyOtp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { email: string; otp: string }) => verifyOtp(v.email, v.otp),
    // Sesi baru: buang semua cache milik sesi lama.
    onSuccess: () => qc.clear(),
  })
}

export function useGoogleSignIn() {
  return useMutation({ mutationFn: signInWithGoogle })
}

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: signOut, onSuccess: () => qc.clear() })
}

/**
 * Simpan preferensi profil (PATCH /me). Optimistis: tema, bahasa, dan mode privasi langsung berlaku;
 * gagal → dikembalikan ke nilai sebelumnya.
 */
export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateMeInput) => updateMe(input),
    onMutate: (input) => {
      const prev = qc.getQueryData<Me | null>(qk.me())
      if (prev) {
        const next = { ...prev, ...input }
        qc.setQueryData(qk.me(), next)
        applyUserPrefs(next)
      }
      return { prev }
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(qk.me(), ctx.prev)
        applyUserPrefs(ctx.prev)
      }
    },
    onSuccess: (me) => {
      qc.setQueryData(qk.me(), me)
    },
  })
}
