"use client";

import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button } from "@b3-crow/ui-kit";
import { LuCircleX } from "react-icons/lu";
import { motion } from "framer-motion";

export default function CheckoutCancelPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200">
			<AnimatedBackground />
			<Navbar logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }} />

			<main className="flex-grow flex flex-col items-center justify-center px-4 max-w-md mx-auto relative z-10">
				<motion.div
					className="text-center space-y-6"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.3, delay: 0.2 }}
					>
						<LuCircleX className="text-red-500 text-6xl mx-auto" />
					</motion.div>

					<PageHeader
						label="Checkout Cancelled"
						title="Payment was cancelled"
						description="Your checkout session was cancelled. No charges were made to your account."
					/>

					<div className="flex flex-col gap-3 pt-4">
						<Button onClick={() => router.push("/choose-modules")} size="lg">
							Try Again
						</Button>
						<Button variant="secondary" onClick={() => router.push("/choose-modules")} size="lg">
							Change plan
						</Button>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
