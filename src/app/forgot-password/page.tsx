"use client";

import { useState } from "react";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuCircleCheck } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
	const [errors, setErrors] = useState<FormErrors<ForgotPasswordFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			const validatedData = forgotPasswordSchema.parse(formValues);

			const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { error } = await (authClient as any).requestPasswordReset({
				email: validatedData.email,
				redirectTo: `${siteUrl}/reset-password`,
			});

			if (error) {
				toast.error(error.message || "Failed to send reset email");
				return;
			}

			setIsSuccess(true);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors<ForgotPasswordFormData> = {};
				const zodError = error as z.ZodError<ForgotPasswordFormData>;

				zodError.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof ForgotPasswordFormData;
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

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
				rightContent={
					<span className="text-gray-500 flex items-center gap-2">
						Remember your password? <NavLink href="/login">Log in</NavLink>
					</span>
				}
			/>

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-8">
				<div className="w-full max-w-[380px] flex flex-col items-center text-center">
					{isSuccess ? (
						<motion.div
							className="w-full flex flex-col items-center text-center"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							<motion.div
								className="mb-6"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
							>
								<LuCircleCheck className="w-16 h-16 text-green-500" />
							</motion.div>
							<PageHeader
								label="Email Sent"
								title="Check your email."
								description="We've sent a password reset link to your email address. The link will expire in 1 hour."
							/>
							<motion.div
								className="w-full mt-4"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<NavLink href="/login">
									<Button
										variant="outline"
										type="button"
										className="w-full border-white/10 hover:bg-white/5 hover:border-white/20"
										showArrow={false}
									>
										Back to login
									</Button>
								</NavLink>
							</motion.div>
						</motion.div>
					) : (
						<>
							<PageHeader
								label="Forgot Password"
								title="Reset your password."
								description="Enter your email address and we'll send you a link to reset your password."
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
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: 0.5 }}
								>
									<Button
										variant="solid"
										type="submit"
										className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
										showArrow={true}
										arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
										disabled={isSubmitting}
									>
										{isSubmitting ? "Sending" : "Send reset link"}
									</Button>
								</motion.div>
							</motion.form>

							<motion.div
								className="w-full mt-4"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.6 }}
							>
								<NavLink href="/login">
									<span className="text-sm text-gray-500 hover:text-white transition-colors">
										Back to login
									</span>
								</NavLink>
							</motion.div>
						</>
					)}
				</div>
			</main>

			<div className="w-full py-4 text-center z-10 relative"></div>
		</div>
	);
}
