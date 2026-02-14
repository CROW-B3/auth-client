"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Button, Input, Navbar, NavLink, PageHeader, Footer } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuUpload, LuX } from "react-icons/lu";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getSession } from "@/lib/auth-client";
import { setPendingProfilePicture } from "@/stores/onboarding-store";
import Image from "next/image";

const completeProfileSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;
type FormErrors<T> = Partial<Record<keyof T, string>>;

export default function CompleteProfilePage() {
	const router = useRouter();
	const [errors, setErrors] = useState<FormErrors<CompleteProfileFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [name, setName] = useState("");
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [, setUserId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const session = await getSession();
				if (!session?.data?.user) {
					toast.error("Session expired. Please sign in again.");
					router.push("/login");
					return;
				}

				setName(session.data.user.name || "");

				const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";
				const userResponse = await fetch(
					`${API_GATEWAY_URL}/api/v1/users/by-auth-id/${session.data.user.id}`,
					{ credentials: "include" }
				);

				if (userResponse.ok) {
					router.push("/organization");
					return;
				}

				setUserId(session.data.user.id);
				setIsLoading(false);
			} catch {
				toast.error("Failed to load profile. Please try again.");
				router.push("/login");
			}
		};

		checkSession();
	}, [router]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("File size exceeds 5MB limit");
			return;
		}

		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("Invalid file type. Only JPG, PNG, and WebP are allowed");
			return;
		}

		setProfilePicture(file);
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (!file) return;

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("File size exceeds 5MB limit");
			return;
		}

		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("Invalid file type. Only JPG, PNG, and WebP are allowed");
			return;
		}

		setProfilePicture(file);
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const removeImage = () => {
		setProfilePicture(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			completeProfileSchema.parse(formValues);

			if (profilePicture) {
				setPendingProfilePicture(profilePicture);
			}

			router.push("/organization");
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors = error.flatten().fieldErrors;
				const newErrors: FormErrors<CompleteProfileFormData> = {};

				for (const [key, messages] of Object.entries(fieldErrors)) {
					if (Array.isArray(messages) && messages.length > 0) {
						const fieldName = key as keyof CompleteProfileFormData;
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

	if (isLoading) {
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
					</span>
				}
			/>

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-4">
				<div className="w-full max-w-[400px] flex flex-col items-center text-center">
					<PageHeader
						label="Complete Profile"
						title="Tell us about yourself"
						description="Add your name and profile picture to personalize your account."
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
								<div
									className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 transition-colors"
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onClick={() => fileInputRef.current?.click()}
								>
									{previewUrl ? (
										<div className="relative">
											<Image
												src={previewUrl}
												alt="Profile preview"
												width={120}
												height={120}
												className="rounded-full object-cover"
											/>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeImage();
												}}
												className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
											>
												<LuX className="w-4 h-4 text-white" />
											</button>
										</div>
									) : (
										<>
											<LuUpload className="w-12 h-12 text-gray-500 mb-2" />
											<p className="text-sm text-gray-400">
												Drop your photo here or click to browse
											</p>
											<p className="text-xs text-gray-600 mt-1">
												JPG, PNG, or WebP (max 5MB)
											</p>
										</>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/jpeg,image/png,image/webp"
										onChange={handleFileChange}
										className="hidden"
									/>
								</div>
							</motion.div>

							<motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
								<Input
									inputSize="sm"
									id="name"
									name="name"
									type="text"
									placeholder="Your name"
									aria-label="Your name"
									autoComplete="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									error={errors.name}
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
								{isSubmitting ? "Saving" : "Continue"}
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
					{ text: "Privacy Policy", href: "/privacy" },
				]}
			/>
		</div>
	);
}
