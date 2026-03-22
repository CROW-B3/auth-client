import { z } from "zod";

const normalizeEmail = (email: string) => email.trim().toLowerCase().normalize("NFKC");

export const inviteTeamSchema = z.object({
	emails: z
		.array(z.string().email("Invalid email address"))
		.min(1, "At least one email is required")
		.refine(
			(emails) => {
				const normalized = emails.map(normalizeEmail);
				return new Set(normalized).size === normalized.length;
			},
			{ message: "Emails must be unique" }
		),
	permissions: z.object({
		chat: z
			.object({
				enabled: z.boolean(),
				components: z.array(z.enum(["web", "cctv", "social"])),
				lookbackWindow: z.enum(["7days", "30days", "90days", "1year", "all"]),
			})
			.refine(
				(chat) => !chat.enabled || chat.components.length > 0,
				{
					message: "At least one component required when chat is enabled",
					path: ["components"],
				}
			)
			.optional(),
		interactions: z.boolean().optional(),
		patterns: z.boolean().optional(),
		teamManagement: z.boolean().optional(),
		apiKeyManagement: z.boolean().optional(),
	}),
});

export const acceptInviteSchema = z.object({
	fullname: z
		.string()
		.min(2, "Full name must be at least 2 characters")
		.max(100, "Full name must be less than 100 characters")
		.regex(/^[\p{L}\s'-]+$/u, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
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
		apiKeyManagement?: boolean;
	};
	sentAt: Date;
}
