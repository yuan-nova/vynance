import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AuthProviders, Me } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchAuthProviders, fetchMe, requestOtp, signInWithGoogle, signOut, verifyOtp } from "../services/auth.service"

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
