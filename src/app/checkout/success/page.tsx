"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBackground, Button, Navbar, PageHeader } from "@b3-crow/ui-kit";
import { LuArrowRight, LuCircleCheck } from "react-icons/lu";
import { motion } from "framer-motion";
import { useSubmitCheckout, useOnboardingGuard } from "@/hooks/use-onboarding";
import { useOnboardingStore } from "@/stores/onboarding-store";

function CheckoutSuccessContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = searchParams.get('session_id');
	const { onboardingId } = useOnboardingStore();
	const submitCheckout = useSubmitCheckout();
	const hasSubmitted = useRef(false);

	useOnboardingGuard("checkout");

	useEffect(() => {
		if (!sessionId) {
			router.push('/choose-modules');
			return;
		}

		if (!onboardingId || hasSubmitted.current) return;
		hasSubmitted.current = true;

		submitCheckout.mutateAsync({
			onboardingId,
			input: { stripeSessionId: sessionId },
		}).catch(() => {});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId, onboardingId]);

	const handleContinue = () => {
		router.push('/connect-products');
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-4">
				<motion.div
					className="flex flex-col items-center text-center max-w-md"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
						className="mb-6"
					>
						<LuCircleCheck className="w-20 h-20 text-green-500" />
					</motion.div>

					<PageHeader
						label="Payment Successful"
						title="You're all set!"
						description="Your subscription is now active. Let's connect your data sources."
					/>

					<motion.div
						className="w-full max-w-sm mt-4"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
					>
						<Button
							variant="solid"
							type="button"
							onClick={handleContinue}
							className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
							showArrow={true}
							arrowIcon={<LuArrowRight />}
						>
							Connect your products
						</Button>
					</motion.div>
				</motion.div>
			</main>
		</div>
	);
}

export default function CheckoutSuccessPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<CheckoutSuccessContent />
		</Suspense>
	);
}
