"use client";

import { AnimatedBackground, Button, Navbar, PageHeader, InvitationDetailsCard } from "@b3-crow/ui-kit";
import { LuArrowRight } from "react-icons/lu";
import { motion } from "framer-motion";
import { MOCK_SUCCESS_FIELDS } from "@/lib/constants/mock-data";

export default function SuccessPage() {
	const handleContinue = () => {
		const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
		if (dashboardUrl) {
			window.location.href = dashboardUrl;
		}
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
						label="SUCCESS"
						title="You're in."
						description=""
					/>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<InvitationDetailsCard
							fields={[...MOCK_SUCCESS_FIELDS]}
						/>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<Button
							variant="solid"
							type="button"
							onClick={handleContinue}
							className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
							showArrow={true}
							arrowIcon={<LuArrowRight />}
						>
							Continue
						</Button>
					</motion.div>
				</motion.div>
			</main>
		</div>
	);
}
