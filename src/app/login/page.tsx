"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Button, Divider, Input, Navbar, NavLink, PageHeader } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { GrGoogle } from "react-icons/gr";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { signInSchema, type SignInFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";
import { signIn, getSession } from "@/lib/auth-client";
import { useDetermineAuthFlow } from "@/hooks/use-onboarding";

export default function LoginPage() {
	const router = useRouter();
	const [errors, setErrors] = useState<FormErrors<SignInFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const determineAuthFlow = useDetermineAuthFlow();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			const validatedData = signInSchema.parse(formValues);

			const { error } = await signIn.email({
				email: validatedData.email,
				password: validatedData.password,
			});

			if (error) {
				toast.error(error.message || "Invalid email or password");
				return;
			}

			const session = await getSession();
			if (!session?.data?.user?.id) {
				toast.error("Failed to get session");
				return;
			}

			const result = await determineAuthFlow.mutateAsync(session.data.user.id);

			if (result.destination === "dashboard") {
				const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
				window.location.href = dashboardUrl;
				return;
			}

			router.push(result.targetRoute || "/organization");
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors<SignInFormData> = {};
				const zodError = error as z.ZodError<SignInFormData>;

				zodError.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof SignInFormData;
						newErrors[fieldName] = fieldError.message;
					}
				});
				setErrors(newErrors);
				toast.error("Please fix the errors in the form");
			} else {
				toast.error("An unexpected error occurred");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleLogin = async () => {
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
						Don&apos;t have an account? <NavLink href="/signup">Sign up</NavLink>
					</span>
				}
			/>

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-8">
				<div className="w-full max-w-[380px] flex flex-col items-center text-center">
					<PageHeader
						label="Log In"
						title="Welcome back."
						description="Sign in to access your CROW dashboard."
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
									id="email"
									name="email"
									type="email"
									placeholder="Work email"
									aria-label="Work email"
									autoComplete="email"
									error={errors.email}
								/>
							</motion.div>
							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="Password"
									aria-label="Password"
									autoComplete="current-password"
									error={errors.password}
								/>
							</motion.div>
						</motion.div>

						<motion.div
							className="text-right"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.5 }}
						>
							<a
								href="/forgot-password"
								className="text-sm text-gray-500 hover:text-white transition-colors"
							>
								Forgot password?
							</a>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.6 }}
						>
							<Button
								variant="solid"
								type="submit"
								className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
								showArrow={true}
								arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
								disabled={isSubmitting}
							>
								{isSubmitting ? "Signing in" : "Sign in"}
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
							transition={{ duration: 0.5, delay: 0.7 }}
						>
							<Divider text="Or" />
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.8 }}
						>
							<Button
								variant="outline"
								type="button"
								onClick={handleGoogleLogin}
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
