"use client";

import { useState } from "react";
import { AnimatedBackground, Button, Checkbox, Divider, Input, Navbar, NavLink, PageHeader } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { GrGoogle } from "react-icons/gr";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { signUpSchema, type SignUpFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";

export default function Home() {
	const [errors, setErrors] = useState<FormErrors<SignUpFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

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
			console.log("Validated data:", validatedData);

			await new Promise((resolve) => setTimeout(resolve, 2000));

			toast.success("Account created successfully!");

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
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSignup = () => {
		toast.success("Google Sign-Up coming soon!");
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
					<PageHeader
						label="Sign Up"
						title="Create your CROW account."
						description="Start unifying Web, CCTV, and Social signals."
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
									error={errors.email}
								/>
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
											href="#"
											className="text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-2"
										>
											Terms
										</a>{" "}
										and{" "}
										<a
											href="#"
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
								arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
								disabled={isSubmitting}
							>
								{isSubmitting ? "Setting up" : "Continue"}
							</Button>
						</motion.div>

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
								className="w-full border-white/10 hover:bg-white/5 hover:border-white/20"
							>
								<div className="flex items-center gap-2">
									<GrGoogle className="w-3 h-3" />
									Continue with Google
								</div>
							</Button>
						</motion.div>
					</motion.form>
				</div>
			</main>

			<div className="w-full py-4 text-center z-10 relative"></div>
		</div>
	);
}
