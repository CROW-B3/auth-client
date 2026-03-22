"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuCircleCheck, LuCircleX } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";
import { authClient } from "@/lib/auth-client";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const error = searchParams.get("error");

	const [errors, setErrors] = useState<FormErrors<ResetPasswordFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const isInvalidToken = error === "INVALID_TOKEN" || !token;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			const validatedData = resetPasswordSchema.parse(formValues);

			const { error: resetError } = await authClient.resetPassword({
				newPassword: validatedData.password,
				token: token!,
			});

			if (resetError) {
				toast.error(resetError.message || "Failed to reset password");
				return;
			}

			setIsSuccess(true);
			toast.success("Password reset successfully!");

			redirectTimer.current = setTimeout(() => {
				router.push("/login");
			}, 2000);
		} catch (err) {
			if (err instanceof z.ZodError) {
				const newErrors: FormErrors<ResetPasswordFormData> = {};
				const zodError = err as z.ZodError<ResetPasswordFormData>;

				zodError.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof ResetPasswordFormData;
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

	if (isInvalidToken) {
		return (
			<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
				<AnimatedBackground />

				<Navbar
					logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
					rightContent={
						<span className="text-gray-500 flex items-center gap-2">
							Need a new link? <NavLink href="/forgot-password">Reset password</NavLink>
						</span>
					}
				/>

				<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-8">
					<div className="w-full max-w-[380px] flex flex-col items-center text-center">
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
								<LuCircleX className="w-16 h-16 text-red-500" />
							</motion.div>
							<PageHeader
								label="Invalid Link"
								title="This link is invalid or has expired."
								description="Password reset links expire after 1 hour. Please request a new one."
							/>
							<motion.div
								className="w-full mt-4 space-y-3"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<NavLink href="/forgot-password">
									<Button
										variant="solid"
										type="button"
										className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
										showArrow={true}
										arrowIcon={<LuArrowRight />}
									>
										Request new link
									</Button>
								</NavLink>
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
					</div>
				</main>

				<div className="w-full py-4 text-center z-10 relative"></div>
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
								label="Success"
								title="Password reset complete."
								description="Your password has been updated. Redirecting you to login..."
							/>
						</motion.div>
					) : (
						<>
							<PageHeader
								label="Reset Password"
								title="Set a new password."
								description="Your new password must be at least 8 characters and include uppercase, lowercase, number, and special character."
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
											id="password"
											name="password"
											type="password"
											placeholder="New password"
											aria-label="New password"
											autoComplete="new-password"
											error={errors.password}
										/>
									</motion.div>
									<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type="password"
											placeholder="Confirm password"
											aria-label="Confirm password"
											autoComplete="new-password"
											error={errors.confirmPassword}
										/>
									</motion.div>
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
										{isSubmitting ? "Resetting" : "Reset password"}
									</Button>
								</motion.div>
							</motion.form>

							<motion.div
								className="w-full mt-4"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.7 }}
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

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<LuLoader className="w-8 h-8 animate-spin text-violet-500" />
			</div>
		}>
			<ResetPasswordContent />
		</Suspense>
	);
}
