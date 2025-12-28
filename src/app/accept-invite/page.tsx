"use client";

import { useState } from "react";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader, InvitationDetailsCard } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuEye, LuEyeOff } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { acceptInviteSchema, type AcceptInviteFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";

export default function AcceptInvitePage() {
	const router = useRouter();
	const [errors, setErrors] = useState<FormErrors<AcceptInviteFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const invitationDetails = {
		organization: "Global Retail Ops",
		role: "Analyst",
		email: "name@company.com",
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			const validatedData = acceptInviteSchema.parse(formValues);
			console.log("Validated data:", validatedData);

			await new Promise((resolve) => setTimeout(resolve, 2000));

			toast.success("Welcome to the team! Redirecting...");

			setTimeout(() => {
				router.push("/dashboard");
			}, 1000);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors<AcceptInviteFormData> = {};
				const zodError = error as z.ZodError<AcceptInviteFormData>;

				zodError.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof AcceptInviteFormData;
						newErrors[fieldName] = fieldError.message;
					}
				});
				setErrors(newErrors);

				if (zodError.issues.length > 0) {
					toast.error("Please fix the errors in the form");
				}
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

							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<div className="relative">
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
										className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-violet-400 focus:outline-none transition-colors"
									>
										{showPassword ? <LuEyeOff className="w-[18px] h-[18px]" /> : <LuEye className="w-[18px] h-[18px]" />}
									</button>
								</div>
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
