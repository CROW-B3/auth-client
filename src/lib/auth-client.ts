import { createAuthClient } from "better-auth/react"
import { organizationClient, apiKeyClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
	basePath: "/api/v1/auth",
	fetchOptions: {
		credentials: "include",
	},
	plugins: [
		organizationClient(),
		apiKeyClient(),
	],
})

export const {
	signIn,
	signUp,
	signOut,
	useSession,
	getSession,
	organization,
	apiKey,
} = authClient

export type Session = typeof authClient.$Infer.Session
