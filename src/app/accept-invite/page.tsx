"use client";

import { useState, useEffect } from "react";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader, InvitationDetailsCard } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuEye, LuEyeOff } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInviteSchema, type AcceptInviteFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";

interface InvitationDetails {
	organization: string;
	role: string;
	email: string;
}

export default function AcceptInvitePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [errors, setErrors] = useState<FormErrors<AcceptInviteFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isLoadingInvite, setIsLoadingInvite] = useState(true);
	const [invitationDetails, setInvitationDetails] = useState<InvitationDetails>({
		organization: "Global Retail Ops",
		role: "Analyst",
		email: "name@company.com",
	});

	// Fetch invitation details from URL token
	useEffect(() => {
		const token = searchParams.get("token");

		if (!token) {
			// No token provided, use default mock data for development
			setIsLoadingInvite(false);
			return;
		}

		const fetchInvitationDetails = async () => {
			try {
				const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`);

				if (!response.ok) {
					// Only show toast for server errors (500+), not for 404 (API not implemented)
					if (response.status >= 500) {
						toast.error("Failed to load invitation details");
					}
					throw new Error("Failed to fetch invitation details");
				}

				const data = await response.json() as { organization: string; role: string; email: string };
				setInvitationDetails({
					organization: data.organization,
					role: data.role,
					email: data.email,
				});
			} catch (error) {
				console.error("Error fetching invitation:", error);
				// Network errors or other issues - silently fail in development
			} finally {
				setIsLoadingInvite(false);
			}
		};

		void fetchInvitationDetails();
	}, [searchParams]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			// Validate form data
			const validatedData = acceptInviteSchema.parse(formValues);

			// Get token from URL
			const token = searchParams.get("token");

			// Make API call to accept invitation
			const response = await fetch("/api/invitations/accept", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					fullname: validatedData.fullname,
					password: validatedData.password,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: "Failed to accept invitation" })) as { message?: string };
				throw new Error(errorData.message || "Failed to accept invitation");
			}

			toast.success("Welcome to the team! Redirecting...");

			setTimeout(() => {
				router.push("/dashboard");
			}, 1000);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors<AcceptInviteFormData> = {};

				error.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof AcceptInviteFormData;
						newErrors[fieldName] = fieldError.message;
					}
				});
				setErrors(newErrors);

				if (error.issues.length > 0) {
					toast.error("Please fix the errors in the form");
				}
			} else {
				// Handle API errors or other unexpected errors
				console.error("Accept invite error:", error);
				const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
				toast.error(errorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDecline = () => {
		toast.error("Invitation declined");
		router.push("/");
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-6 pb-6 max-w-7xl mx-auto h-full overflow-hidden">
				<motion.div
					className="w-full max-w-[440px] flex flex-col justify-center"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<PageHeader
						label="INVITATION"
						title="You've been invited to join CROW."
						description="Accept to join the organization workspace."
					/>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<InvitationDetailsCard
							organization={invitationDetails.organization}
							role={invitationDetails.role}
							email={invitationDetails.email}
						/>
					</motion.div>

					<motion.form
						className="space-y-4 mb-8"
						onSubmit={handleSubmit}
						noValidate
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
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
										delayChildren: 0.4,
									},
								},
							}}
						>
							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<Input
									inputSize="sm"
									id="fullname"
									name="fullname"
									type="text"
									placeholder="Your name"
									aria-label="Full name"
									autoComplete="name"
									error={errors.fullname}
								/>
							</motion.div>

							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="relative">
								<Input
									inputSize="sm"
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									placeholder="Create password"
									aria-label="Create password"
									autoComplete="new-password"
									error={errors.password}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute top-0 right-0 h-9 flex items-center justify-center px-4 text-gray-500 hover:text-violet-400 focus:outline-none transition-colors z-10"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? <LuEyeOff className="w-[18px] h-[18px]" /> : <LuEye className="w-[18px] h-[18px]" />}
								</button>
							</motion.div>
						</motion.div>

						<motion.div
							className="space-y-3"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.7 }}
						>
							<Button
								variant="solid"
								type="submit"
								className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
								arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
								disabled={isSubmitting}
							>
								{isSubmitting ? "Accepting" : "Accept invitation"}
							</Button>
							<Button
								variant="outline"
								type="button"
								onClick={handleDecline}
								showArrow={false}
								className="w-full border-white/10 hover:border-white/20"
							>
								Decline
							</Button>
						</motion.div>
					</motion.form>

					<motion.div
						className="mt-5 text-center flex flex-col items-center gap-3"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8 }}
					>
						<NavLink href="/login">Sign in instead</NavLink>
						<p className="text-[11px] text-gray-600">
							By accepting, you'll be added to the organization workspace.
						</p>
					</motion.div>
				</motion.div>
			</main>
		</div>
	);
}
