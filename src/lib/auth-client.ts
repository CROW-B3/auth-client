import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL,
	basePath: "/api/v1/auth",
	fetchOptions: {
		credentials: "include",
	},
})

export const {
	signIn,
	signUp,
	signOut,
	useSession,
	getSession,
} = authClient

export type Session = typeof authClient.$Infer.Session
