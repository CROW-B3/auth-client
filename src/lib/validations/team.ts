import { z } from "zod";

export const inviteTeamSchema = z.object({
	emails: z
		.array(z.string().email("Invalid email address"))
		.min(1, "At least one email is required"),
	permissions: z.object({
		chat: z.object({
			enabled: z.boolean(),
			components: z.array(z.enum(["web", "cctv", "social"])).min(1, "At least one component required when chat is enabled"),
			lookbackWindow: z.enum(["7days", "30days", "90days", "1year", "all"]),
		}),
		interactions: z.boolean(),
		patterns: z.boolean(),
		teamManagement: z.boolean(),
		apiKeys: z.object({
			enabled: z.boolean(),
			scopes: z.object({
				interactions: z.boolean(),
				patterns: z.boolean(),
			}),
		}),
	}),
});

export const acceptInviteSchema = z.object({
	fullname: z
		.string()
		.min(2, "Full name must be at least 2 characters")
		.max(100, "Full name must be less than 100 characters")
		.regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type InviteTeamFormData = z.infer<typeof inviteTeamSchema>;
export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export interface PendingInvite {
	id: string;
	email: string;
	initials: string;
	status: "pending" | "accepted" | "expired";
	permissions: {
		chat?: {
			components: string[];
			lookbackWindow: string;
		};
		interactions?: boolean;
		patterns?: boolean;
		teamManagement?: boolean;
		apiKeys?: {
			scopes: string[];
		};
	};
	sentAt: Date;
}
