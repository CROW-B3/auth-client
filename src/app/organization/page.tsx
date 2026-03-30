"use client";

import { useState, useEffect } from "react";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader, Footer } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createOrganizationSchema, type CreateOrganizationFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";
import { organization, getSession } from "@/lib/auth-client";
import { useOnboardingStore, getPendingProfilePicture, setPendingProfilePicture } from "@/stores/onboarding-store";
import { useStartOnboarding } from "@/hooks/use-onboarding";

export default function CreateOrganizationPage() {
	const [errors, setErrors] = useState<FormErrors<CreateOrganizationFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);

	const { onboardingId, pendingProfileName, setOrganizationName, setBetterAuthOrgId } = useOnboardingStore();
	const startOnboarding = useStartOnboarding();

	useEffect(() => {
		if (onboardingId) {
			setIsInitializing(false);
			return;
		}

		const initializeOnboarding = async () => {
			const session = await getSession();
			if (!session?.data?.user?.id) {
				window.location.href = "/signup";
				return;
			}

			try {
				const result = await startOnboarding.mutateAsync(session.data.user.id);
				if (result.redirect) {
					window.location.href = result.redirect;
					return;
				}
				setIsInitializing(false);
			} catch {
				toast.error("Failed to initialize onboarding");
				window.location.href = "/signup";
			}
		};

		initializeOnboarding();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onboardingId]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			const validatedData = createOrganizationSchema.parse(formValues);

			const session = await getSession();
			if (!session?.data?.user?.id) {
				toast.error("Session expired. Please sign in again.");
				window.location.href = "/signup";
				return;
			}

			const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

			const baseSlug = validatedData.organizationName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
			const slug = `${baseSlug}-${Date.now()}`;

			const { data: org, error: orgError } = await organization.create({
				name: validatedData.organizationName,
				slug,
			});

			if (orgError || !org) {
				toast.error(orgError?.message || "Failed to create organization");
				return;
			}

			setOrganizationName(validatedData.organizationName);
			setBetterAuthOrgId(org.id);

			const { createAuthHeaders } = await import("@/lib/auth-token");
			const authHeaders = await createAuthHeaders();

			if (onboardingId) {
				try {
					await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/organization`, {
						method: "PATCH",
						headers: authHeaders,
						credentials: "include",
						body: JSON.stringify({
							betterAuthOrgId: org.id,
							organizationName: validatedData.organizationName,
							betterAuthUserId: session.data.user.id,
						}),
					});
				} catch {}
			}

			if (pendingProfileName && pendingProfileName !== session.data.user.name) {
				try {
					const { authClient: client } = await import("@/lib/auth-client");
					await client.updateUser({ name: pendingProfileName });
				} catch {}
			}

			toast.success("Organization created successfully!");
			window.location.href = "/choose-modules";

		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors = error.flatten().fieldErrors;
				const newErrors: FormErrors<CreateOrganizationFormData> = {};

				for (const [key, messages] of Object.entries(fieldErrors)) {
					if (Array.isArray(messages) && messages.length > 0) {
						const fieldName = key as keyof CreateOrganizationFormData;
						newErrors[fieldName] = messages[0];
					}
				}

				setErrors(newErrors);
				toast.error("Please fix the errors in the form");
			} else {
				toast.error("An unexpected error occurred. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isInitializing) {
		return (
			<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
				<AnimatedBackground />
				<div className="flex-grow flex items-center justify-center">
					<LuLoader className="w-8 h-8 animate-spin text-violet-500" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
				rightContent={
				<span className="text-gray-500 flex items-center gap-2">
					Already have an account? <NavLink href="/login">Log in</NavLink>
				</span>}
			/>

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-4">
				<div className="w-full max-w-[400px] flex flex-col items-center text-center">
					<PageHeader
						label="Sign Up"
						title="Create your organization"
						description="Start unifying Web, CCTV, and Social signals into one interaction model."
					/>

					<motion.form
						className="w-full space-y-4"
						onSubmit={handleSubmit}
						noValidate
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<motion.div
							className="space-y-3"
							initial="hidden"
							animate="visible"
							variants={{
								hidden: { opacity: 0 },
								visible: {
									opacity: 1,
									transition: {
										staggerChildren: 0.1,
										delayChildren: 0.3,
									},
								},
							}}
						>
							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<Input
									inputSize="sm"
									id="organizationName"
									name="organizationName"
									type="text"
									placeholder="Organization name"
									aria-label="Organization name"
									autoComplete="organization"
									error={errors.organizationName}
								/>
							</motion.div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.8 }}
						>
							<button
								type="submit"
								className="rounded-full transition-all font-medium flex items-center justify-center gap-2 whitespace-nowrap text-white px-4 py-2.5 text-sm w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Creating" : "Create organization"}
								{isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
							</button>
						</motion.div>

					</motion.form>
				</div>
			</main>

			<Footer
				termsPrefix="By creating an account, you agree to"
				termsLinks={[
				{ text: "Terms", href: "/terms" },
				{ text: "Privacy Policy", href: "/privacy" }
				]}
 			 />
		</div>
	);
}
