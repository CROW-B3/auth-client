"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, Input } from "@b3-crow/ui-kit";
import { LuLink, LuArrowRight, LuSkipForward, LuCheck } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitProducts, useSkipProducts, useOnboardingGuard } from "@/hooks/use-onboarding";

const FADE_IN_ANIMATION = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function triggerBackgroundProductCrawl(organizationId: string, onboardingId: string, sourceType: string, sourceValue: string): void {
	import("@/lib/auth-token").then(({ createAuthHeaders }) =>
		createAuthHeaders().then((headers) =>
			fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/crawler-jobs`, {
				method: "POST",
				headers,
				credentials: "include",
				body: JSON.stringify({ organizationId, onboardingId, sourceType, sourceValue }),
			})
				.then((res) => {
					if (res.ok) toast.success("Product crawl started in the background");
					else toast.error("Failed to start crawling");
				})
				.catch(() => toast.error("Failed to start crawling"))
		)
	);
}

function ProductFeedUrlInput({
	feedUrl,
	urlValidationError,
	isDisabled,
	onChangeFeedUrl,
}: {
	feedUrl: string;
	urlValidationError: string;
	isDisabled: boolean;
	onChangeFeedUrl: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-medium text-gray-200 flex items-center gap-2">
				<LuLink className="w-4 h-4" />
				Product feed URL
			</label>
			<Input
				id="feedUrl"
				name="feedUrl"
				type="url"
				placeholder="https://example.com/products.json"
				value={feedUrl}
				onChange={onChangeFeedUrl}
				error={urlValidationError}
				inputSize="md"
				disabled={isDisabled}
			/>
			<p className="text-xs text-gray-500 px-1">
				Supports JSON or CSV endpoints
			</p>
		</div>
	);
}

function ConnectionReadyIndicator({ hasUrl }: { hasUrl: boolean }) {
	if (!hasUrl) return null;

	return (
		<motion.div
			className="flex items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<LuCheck className="w-4 h-4 text-violet-400" />
			<span className="text-sm text-violet-300">
				URL provided - ready to connect
			</span>
		</motion.div>
	);
}

function NavigationButtons({
	isSubmitting,
	onClickContinue,
	onClickSkip,
}: {
	isSubmitting: boolean;
	onClickContinue: () => void;
	onClickSkip: () => void;
}) {
	return (
		<motion.div
			className="w-full flex flex-col gap-4 mt-8"
			{...FADE_IN_ANIMATION}
			transition={{ duration: 0.5, delay: 0.5 }}
		>
			<Button
				variant="solid"
				className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50"
				arrowIcon={<LuArrowRight />}
				onClick={onClickContinue}
				disabled={isSubmitting}
			>
				{isSubmitting ? "Connecting..." : "Continue"}
			</Button>
			<Button
				variant="ghost"
				className="w-full text-gray-500 hover:text-white"
				arrowIcon={<LuSkipForward />}
				onClick={onClickSkip}
				disabled={isSubmitting}
			>
				Skip for now
			</Button>
		</motion.div>
	);
}

export default function ConnectProductsPage() {
	const router = useRouter();
	const [feedUrl, setFeedUrl] = useState("");
	const [urlValidationError, setUrlValidationError] = useState("");

	const { onboardingId, betterAuthOrgId } = useOnboardingStore();
	const submitProducts = useSubmitProducts();
	const skipProducts = useSkipProducts();

	useOnboardingGuard("products");

	const validateFeedUrl = (url: string): boolean => {
		if (!url.trim()) { setUrlValidationError("Please enter a URL"); return false; }
		try {
			const parsed = new URL(url);
			if (parsed.protocol !== 'https:') {
				setUrlValidationError("Only HTTPS URLs are accepted");
				return false;
			}
			setUrlValidationError("");
			return true;
		}
		catch { setUrlValidationError("Please enter a valid URL"); return false; }
	};

	const handleChangeFeedUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setFeedUrl(value);
		if (urlValidationError) setUrlValidationError("");
	};

	const handleClickContinue = async () => {
		if (!feedUrl.trim()) { toast.error("Please provide a product feed URL"); return; }
		if (!validateFeedUrl(feedUrl)) return;
		if (!onboardingId) return;

		try {
			triggerBackgroundProductCrawl(betterAuthOrgId || onboardingId, onboardingId, "url", feedUrl);
			await submitProducts.mutateAsync({ onboardingId, input: { sourceType: "url", sourceValue: feedUrl } });
			router.push("/setup-components");
		} catch {
			toast.error("Failed to connect products. Please try again.");
		}
	};

	const handleClickSkip = async () => {
		if (!onboardingId) { router.push("/setup-components"); return; }
		try {
			await skipProducts.mutateAsync(onboardingId);
		} catch {
			// ignore skip errors, proceed anyway
		}
		router.push("/setup-components");
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />
			<Navbar logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }} />
			<main className="flex-grow flex flex-col items-center relative z-10 w-full px-4 pb-20 max-w-lg mx-auto">
				<PageHeader
					label="Products"
					title="Connect your products."
					description="Import your product catalog via URL."
				/>
				<motion.div className="w-full space-y-6" {...FADE_IN_ANIMATION} transition={{ duration: 0.5, delay: 0.3 }}>
					<ProductFeedUrlInput
						feedUrl={feedUrl}
						urlValidationError={urlValidationError}
						isDisabled={false}
						onChangeFeedUrl={handleChangeFeedUrl}
					/>
					<ConnectionReadyIndicator hasUrl={!!feedUrl.trim()} />
				</motion.div>
				<NavigationButtons
					isSubmitting={submitProducts.isPending || skipProducts.isPending}
					onClickContinue={handleClickContinue}
					onClickSkip={handleClickSkip}
				/>
			</main>
		</div>
	);
}
