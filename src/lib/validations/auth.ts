import { z } from "zod";

const emailSchema = z
	.string()
	.min(1, "Email is required")
	.email("Please enter a valid email address");

const fullnameSchema = z
	.string()
	.min(2, "Full name must be at least 2 characters")
	.max(100, "Full name must be less than 100 characters")
	.regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes");

const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/[0-9]/, "Password must contain at least one number")
	.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const passwordConfirmationSchema = z.object({
	password: passwordSchema,
	confirmPassword: z
		.string()
		.min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

export const signUpSchema = z.object({
	fullname: fullnameSchema,
	email: emailSchema,
	password: passwordSchema,
	terms: z.preprocess(
		(val) => {
			if (typeof val === "string") {
				return val === "on";
			}
			if (typeof val === "boolean") {
				return val;
			}
			return false;
		},
		z.boolean().refine((val) => val === true, {
			message: "You must agree to the terms and privacy policy",
		})
	),
});

export const signInSchema = z.object({
	email: emailSchema,
	password: z
		.string()
		.min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

export const resetPasswordSchema = passwordConfirmationSchema;

export const createOrganizationSchema = z.object({
	organizationName: z
		.string()
		.min(2, "Organization name must be at least 2 characters")
		.max(100, "Organization name must be less than 100 characters"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;
