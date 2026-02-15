"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBackground, Button, Checkbox, Divider, Input, Navbar, NavLink, PageHeader } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { GrGoogle } from "react-icons/gr";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { signUpSchema, type SignUpFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";
import { signIn, signUp } from "@/lib/auth-client";

const isUserAlreadyExistsError = (error: { code?: string; message?: string }): boolean => {
	if (error.code === "USER_ALREADY_EXISTS") return true;
	const message = error.message?.toLowerCase() || "";
	return message.includes("already exists") || message.includes("already registered");
};

interface PendingInvitation {
	organizationId: string;
	organizationName: string;
	email: string;
}

function SignUpContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [errors, setErrors] = useState<FormErrors<SignUpFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [pendingInvitation, setPendingInvitation] = useState<PendingInvitation | null>(null);
	const [prefillEmail, setPrefillEmail] = useState("");

	useEffect(() => {
		const storedInvitation = sessionStorage.getItem("pendingInvitation");
		if (storedInvitation) {
			try {
				const invitation = JSON.parse(storedInvitation) as PendingInvitation;
				setPendingInvitation(invitation);
				setPrefillEmail(invitation.email);
			} catch {
			}
		}

		const emailParam = searchParams.get("email");
		if (emailParam && !prefillEmail) {
			setPrefillEmail(emailParam);
		}
	}, [searchParams, prefillEmail]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());
		const data = {
			...formValues,
			terms: formValues.terms === "on" ? "on" : "",
		};

		try {
			const validatedData = signUpSchema.parse(data);

			if (pendingInvitation && validatedData.email !== pendingInvitation.email) {
				toast.error(`Please use the invited email: ${pendingInvitation.email}`);
				setIsSubmitting(false);
				return;
			}

			const { error } = await signUp.email({
				email: validatedData.email,
				password: validatedData.password,
				name: validatedData.fullname,
			});

			if (error) {
				if (isUserAlreadyExistsError(error)) {
					toast.error("An account with this email already exists. Please sign in instead.");
					router.push("/login");
					return;
				}
				toast.error(error.message || "Failed to create account");
				return;
			}

			if (pendingInvitation) {
				try {
					const session = await import("@/lib/auth-client").then((m) => m.getSession());
					if (!session?.data?.user?.id) {
						throw new Error("Session not found");
					}

					const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

					const builderResponse = await fetch(`${API_GATEWAY_URL}/api/v1/users/user-builders`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({
							betterAuthUserId: session.data.user.id,
							organizationId: pendingInvitation.organizationId,
							permissions: {},
						}),
					});

					if (!builderResponse.ok) {
						throw new Error("Failed to create user builder");
					}

					const builderData = await builderResponse.json() as { id: string };

					const finalizeResponse = await fetch(`${API_GATEWAY_URL}/api/v1/users/user-builders/${builderData.id}/finalize`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({
							email: validatedData.email,
							name: validatedData.fullname,
							role: "member",
						}),
					});

					if (!finalizeResponse.ok) {
						throw new Error("Failed to finalize user");
					}

					sessionStorage.removeItem("pendingInvitation");

					toast.success(`Welcome to ${pendingInvitation.organizationName}!`);

					const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
					setTimeout(() => {
						window.location.href = dashboardUrl;
					}, 1000);
					return;
				} catch {
					toast.error("Account created but failed to join organization. Please contact support.");
				}
			}

			toast.success("Account created successfully!");

			await new Promise(resolve => setTimeout(resolve, 500));

			window.location.href = "/complete-profile";

		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors<SignUpFormData> = {};
				const zodError = error as z.ZodError<SignUpFormData>;

				zodError.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof SignUpFormData;
						newErrors[fieldName] = fieldError.message;
					}
				});
				setErrors(newErrors);

				if (newErrors.terms) {
					toast.error(newErrors.terms);
				} else if (zodError.issues.length > 0) {
					toast.error("Please fix the errors in the form");
				}
			} else {
				toast.error("An unexpected error occurred");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	const handleGoogleSignup = async () => {
		setErrors({});
		setIsGoogleLoading(true);
		await signIn.social({
			provider: "google",
			callbackURL: `${window.location.origin}/auth/callback`,
		});
	};

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

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-8">
				<div className="w-full max-w-[380px] flex flex-col items-center text-center">
					{pendingInvitation ? (
						<>
							<PageHeader
								label="Complete Your Invitation"
								title={`Join ${pendingInvitation.organizationName}`}
								description="Create your account to join the team."
							/>
							<motion.div
								className="w-full mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
							>
								✨ You&apos;ve been invited to join as a member
							</motion.div>
						</>
					) : (
						<PageHeader
							label="Sign Up"
							title="Create your CROW account."
							description="Start unifying Web, CCTV, and Social signals."
						/>
					)}

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
									id="fullname"
									name="fullname"
									type="text"
									placeholder="Full name"
									aria-label="Full name"
									autoComplete="name"
									error={errors.fullname}
								/>
							</motion.div>
							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="Work email"
									aria-label="Work email"
									autoComplete="email"
									defaultValue={prefillEmail}
									disabled={!!pendingInvitation}
									error={errors.email}
								/>
								{pendingInvitation && (
									<p className="text-xs text-zinc-400 mt-1">Invited email (cannot be changed)</p>
								)}
							</motion.div>
							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="Create password"
									aria-label="Create password"
									autoComplete="new-password"
									error={errors.password}
								/>
							</motion.div>
						</motion.div>

						<motion.div
							className="px-1"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.6 }}
						>
							<Checkbox
								id="terms"
								name="terms"
								label={
									<>
										I agree to the{" "}
										<a
											href="/terms"
											target="_blank"
											className="text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-2"
										>
											Terms
										</a>{" "}
										and{" "}
										<a
											href="/privacy"
											target="_blank"
											className="text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-2"
										>
											Privacy Policy
										</a>
										.
									</>
								}
							/>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.7 }}
						>
							<Button
								variant="solid"
								type="submit"
								className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
								showArrow={true}
								arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
								disabled={isSubmitting}
							>
								{isSubmitting ? "Setting up" : "Continue"}
							</Button>
						</motion.div>
					</motion.form>

					<motion.div
						className="w-full space-y-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.8 }}
						>
							<Divider text="Or" />
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.9 }}
						>
							<Button
								variant="outline"
								type="button"
								onClick={handleGoogleSignup}
								showArrow={false}
								disabled={isGoogleLoading}
								className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<div className="flex items-center gap-2">
									{isGoogleLoading ? <LuLoader className="w-3 h-3 animate-spin" /> : <GrGoogle className="w-3 h-3" />}
									{isGoogleLoading ? "Connecting..." : "Continue with Google"}
								</div>
							</Button>
						</motion.div>
					</motion.div>
				</div>
			</main>

			<div className="w-full py-4 text-center z-10 relative"></div>
		</div>
	);
}


export default function SignUpPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<LuLoader className="w-8 h-8 animate-spin text-violet-500" />
			</div>
		}>
			<SignUpContent />
		</Suspense>
	);
}
