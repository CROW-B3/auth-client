"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, PackageManagerSelector, type PackageManager, CodeBlock, ApiKeyInput } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { WEB_SDK_INSTALL_COMMANDS, getWebSDKInitCode } from "@/lib/constants/web-sdk";
import { apiKey as apiKeyClient } from "@/lib/auth-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitSource } from "@/hooks/use-onboarding";

export default function ConnectWebPage() {
	const router = useRouter();
	const [packageManager, setPackageManager] = useState<PackageManager>("bun");
	const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [keyError, setKeyError] = useState(false);
	const hasGenerated = useRef(false);
	const { onboardingId, setConnectionStatus } = useOnboardingStore();
	const submitSource = useSubmitSource();

	useEffect(() => {
		if (hasGenerated.current) return;
		hasGenerated.current = true;

		const generateKey = async () => {
			setIsGenerating(true);
			try {
				const { data, error } = await apiKeyClient.create({
					name: "CROW Web SDK Key",
					expiresIn: 60 * 60 * 24 * 365,
				});
				if (error || !data) {
					setKeyError(true);
					toast.error("Failed to generate API key. You can generate one later in Settings.");
					return;
				}
				setGeneratedApiKey(data.key);
			} catch {
				setKeyError(true);
				toast.error("Failed to generate API key. You can generate one later in Settings.");
			} finally {
				setIsGenerating(false);
			}
		};
		generateKey();
	}, []);

	const apiKey = generatedApiKey || (keyError ? "<key-generation-failed>" : "generating...");
	const initCode = getWebSDKInitCode(apiKey);

	const handleContinue = async () => {
		try {
			if (onboardingId && generatedApiKey) {
				await submitSource.mutateAsync({
					onboardingId,
					input: { sourceType: "web", apiKeyId: generatedApiKey },
				});
				setConnectionStatus("web", "connected");
			}
			toast.success("Web source connected!");
		} catch {
			// Non-blocking — connection can be completed later
		}
		router.push("/setup-components");
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center relative z-10 w-full px-4 pb-20 max-w-[600px] mx-auto">
				<PageHeader label="SETUP" title="Connect Web." description="Install the SDK and verify events." />

				<motion.div
					className="w-full space-y-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<div className="space-y-1">
						<ApiKeyInput apiKey={apiKey} label="API Key" />
						<p className="text-xs text-gray-500 px-1">
							Use this key to authenticate web event ingestion.
						</p>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label className="text-xs font-medium text-gray-200">Install</label>
							<PackageManagerSelector
								defaultManager={packageManager}
								onChange={setPackageManager}
							/>
						</div>
						<CodeBlock code={WEB_SDK_INSTALL_COMMANDS[packageManager]} language="bash" showCopy={true} />
					</div>

					<div className="space-y-2">
						<label className="text-xs font-medium text-gray-200 block">Initialize</label>
						<CodeBlock code={initCode} language="typescript" />
						<p className="text-xs text-gray-500 px-1">Initialize once at app startup.</p>
					</div>

					<div className="space-y-2">
						<p className="text-xs text-gray-500 px-1">
							Copy the code above and integrate it into your application. Event verification happens automatically in your dashboard.
						</p>
					</div>

					<div className="pt-4 pb-4">
						<Button
							variant="solid"
							onClick={handleContinue}
							disabled={isGenerating}
							className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50"
						>
							{isGenerating ? "Generating key..." : "Continue"}
						</Button>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
