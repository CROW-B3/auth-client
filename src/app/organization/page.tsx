"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader, Footer } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createOrganizationSchema, type CreateOrganizationFormData } from "@/lib/validations";
import { type FormErrors } from "@/types";

export default function CreateOrganizationPage() {
	const router = useRouter();
	const [errors, setErrors] = useState<FormErrors<CreateOrganizationFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			const validatedData = createOrganizationSchema.parse(formValues);
			console.log("Validated data:", validatedData);

			await new Promise((resolve) => setTimeout(resolve, 2000));

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
				invitePrefix="Have an invite?"
				inviteText="Accept invitation"
				inviteHref="/accept-invite"
				termsPrefix="By creating an account, you agree to"
				termsLinks={[
				{ text: "Terms", href: "/terms" },
				{ text: "Privacy Policy", href: "/privacy" }
				]}
 			 />
		</div>
	);
}
