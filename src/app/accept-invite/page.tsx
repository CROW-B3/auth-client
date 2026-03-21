"use client";

import { useState, useEffect, Suspense } from "react";
import { AnimatedBackground, Button, Navbar, PageHeader } from "@b3-crow/ui-kit";
import { LuCheck, LuX, LuLoader } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

function AcceptInviteContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);

	const organizationId = searchParams.get("org");
	const email = searchParams.get("email");
	const organizationName = searchParams.get("orgName") || "this organization";

	useEffect(() => {
		if (!organizationId || !email) {
			toast.error("Invalid invitation link");
			router.push("/");
		}
	}, [organizationId, email, router]);

	const handleAccept = () => {
		setIsLoading(true);
		sessionStorage.setItem("pendingInvitation", JSON.stringify({
			organizationId,
			organizationName,
			email,
		}));
		router.push(`/signup?email=${encodeURIComponent(email || "")}`);
	};

	const handleDecline = () => {
		toast.error("Invitation declined");
		router.push("/");
	};

	if (!organizationId || !email) {
		return null;
	}

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-6 pb-6 max-w-7xl mx-auto h-full overflow-hidden">
				<motion.div
					className="w-full max-w-[520px] flex flex-col justify-center"
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
						className="mb-8"
					>
						{/* Invitation Details Card */}
						<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm p-6 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-zinc-400 uppercase tracking-wider">Organization</span>
								<span className="text-white font-medium">{organizationName}</span>
							</div>

							<div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

							<div className="flex items-center justify-between">
								<span className="text-sm text-zinc-400 uppercase tracking-wider">Role</span>
								<span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
									Member
								</span>
							</div>

							<div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

							<div className="flex items-center justify-between">
								<span className="text-sm text-zinc-400 uppercase tracking-wider">Email</span>
								<span className="text-white font-medium">{email}</span>
							</div>
						</div>
					</motion.div>

					<motion.div
						className="space-y-3"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<Button
							type="button"
							variant="primary"
							size="lg"
							onClick={handleAccept}
							disabled={isLoading}
							className="w-full"
						>
							{isLoading ? (
								<>
									<LuLoader className="w-5 h-5 animate-spin" />
									<span>Redirecting...</span>
								</>
							) : (
								<>
									<LuCheck className="w-5 h-5" />
									<span>Accept Invitation</span>
								</>
							)}
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="lg"
							onClick={handleDecline}
							disabled={isLoading}
							className="w-full"
						>
							<LuX className="w-5 h-5" />
							<span>Decline</span>
						</Button>
					</motion.div>

					<motion.div
						className="mt-6 text-center text-sm text-zinc-400"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
					>
						<p>By accepting, you&apos;ll be added to the organization workspace.</p>
					</motion.div>

					<motion.div
						className="mt-6 text-center"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
					>
						<button
							onClick={() => router.push("/login")}
							className="text-sm text-zinc-400 hover:text-white transition-colors"
							type="button"
						>
							Sign in Instead
						</button>
					</motion.div>
				</motion.div>
			</main>
		</div>
	);
}

export default function AcceptInvitePage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<LuLoader className="w-8 h-8 animate-spin text-violet-500" />
			</div>
		}>
			<AcceptInviteContent />
		</Suspense>
	);
}
