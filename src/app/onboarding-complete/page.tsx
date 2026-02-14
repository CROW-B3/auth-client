"use client";

import { AnimatedBackground, Navbar, Button } from "@b3-crow/ui-kit";
import { LuCircleCheck, LuArrowRight } from "react-icons/lu";
import { motion } from "framer-motion";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function OnboardingCompletePage() {
	const { organizationName, reset } = useOnboardingStore();
	const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";

	const handleGoToDashboard = () => {
		reset();
		window.location.href = dashboardUrl;
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4">
				<motion.div
					className="text-center max-w-md space-y-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
					>
						<LuCircleCheck className="w-20 h-20 text-green-400 mx-auto" />
					</motion.div>

					<div className="space-y-3">
						<h1 className="text-3xl font-bold text-white">You&apos;re all set!</h1>
						<p className="text-gray-400 text-lg">
							{organizationName ? (
								<><span className="text-violet-300">{organizationName}</span> is ready to go.</>
							) : (
								"Your organization is ready to go."
							)}
						</p>
						<p className="text-gray-500 text-sm">
							Your workspace has been configured. Head to the dashboard to start using CROW.
						</p>
					</div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="space-y-3"
					>
						<Button
							variant="solid"
							className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
							arrowIcon={<LuArrowRight />}
							onClick={handleGoToDashboard}
						>
							Go to Dashboard
						</Button>
					</motion.div>
				</motion.div>
			</main>
		</div>
	);
}
