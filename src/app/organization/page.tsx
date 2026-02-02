"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader, Footer } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createOrganizationSchema, type CreateOrganizationFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";
import { organization, getSession } from "@/lib/auth-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitOrganization, useStartOnboarding } from "@/hooks/use-onboarding";

export default function CreateOrganizationPage() {
	const router = useRouter();
	const [errors, setErrors] = useState<FormErrors<CreateOrganizationFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);

	const { onboardingId, setOrganizationName, setBetterAuthOrgId } = useOnboardingStore();
	const submitOrganization = useSubmitOrganization();
	const startOnboarding = useStartOnboarding();

	useEffect(() => {
		if (onboardingId) {
			setIsInitializing(false);
			return;
		}

		const initializeOnboarding = async () => {
			const session = await getSession();
			if (!session?.data?.user?.id) {
				router.push("/signup");
				return;
			}

			try {
				const result = await startOnboarding.mutateAsync(session.data.user.id);
				if (result.redirect) {
					router.push(result.redirect);
					return;
				}
				setIsInitializing(false);
			} catch {
				toast.error("Failed to initialize onboarding");
				router.push("/signup");
			}
		};

		initializeOnboarding();
	}, []);

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
				router.push("/signup");
				return;
			}

			const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

			// Step 1: Create Better Auth organization
			// Generate unique slug from organization name with timestamp
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

			if (!onboardingId) {
				toast.error("Onboarding not initialized");
				return;
			}

			// Step 2: Create org-builder
			const orgBuilderResponse = await fetch(`${API_GATEWAY_URL}/api/v1/organizations/org-builders`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					betterAuthOrgId: org.id,
					name: validatedData.organizationName,
				}),
			});

			if (!orgBuilderResponse.ok) {
				toast.error("Failed to create organization builder");
				return;
			}

			const orgBuilder = await orgBuilderResponse.json();

			// Step 3: Create user-builder
			const userBuilderResponse = await fetch(`${API_GATEWAY_URL}/api/v1/users/user-builders`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					betterAuthUserId: session.data.user.id,
					organizationId: orgBuilder.id,
					permissions: {
						chat: {
							enabled: true,
							components: ["web", "cctv", "social"],
							lookbackWindow: "all",
						},
						interactions: true,
						patterns: true,
						teamManagement: true,
						apiKeyManagement: true,
					},
				}),
			});

			if (!userBuilderResponse.ok) {
				toast.error("Failed to create user builder");
				return;
			}

			const userBuilder = await userBuilderResponse.json();

			// Step 4: Create billing-builder
			const billingBuilderResponse = await fetch(`${API_GATEWAY_URL}/api/v1/billing/billing-builders`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					organizationId: orgBuilder.id,
				}),
			});

			if (!billingBuilderResponse.ok) {
				toast.error("Failed to create billing builder");
				return;
			}

			const billingBuilder = await billingBuilderResponse.json();

			// Step 5: Update onboarding with all IDs
			await submitOrganization.mutateAsync({
				onboardingId,
				input: {
					betterAuthOrgId: org.id,
					orgBuilderId: orgBuilder.id,
					userBuilderId: userBuilder.id,
					billingBuilderId: billingBuilder.id,
				},
			});

			router.push("/choose-plan");

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
				console.error("An unexpected error occurred:", error);
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
							<Button
								variant="solid"
								type="submit"
								className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
								showArrow={true}
								arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
								disabled={isSubmitting}
							>
								{isSubmitting ? "Creating" : "Create organization"}
							</Button>
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
