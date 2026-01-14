"use client";

import { useState, useEffect } from "react";
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

	const { onboardingId, setConnectionStatus } = useOnboardingStore();
	const submitSource = useSubmitSource();

	useEffect(() => {
		const generateKey = async () => {
			setIsGenerating(true);
			try {
				const { data, error } = await apiKeyClient.create({
					name: "CROW Web SDK Key",
					expiresIn: 60 * 60 * 24 * 365,
				});
				if (error || !data) {
					setGeneratedApiKey("crow_sk_demo_placeholder");
					return;
				}
				setGeneratedApiKey(data.key);
			} catch {
				setGeneratedApiKey("crow_sk_demo_placeholder");
			} finally {
				setIsGenerating(false);
			}
		};
		generateKey();
	}, []);

	const apiKey = generatedApiKey || "crow_sk_demo_placeholder";
	const initCode = getWebSDKInitCode(apiKey);

	const handleConnect = async () => {
		try {
			if (onboardingId && generatedApiKey) {
				await submitSource.mutateAsync({
					onboardingId,
					input: { sourceType: "web", apiKeyId: generatedApiKey },
				});
			}

			setConnectionStatus("web", "connected");

			const savedStatus = localStorage.getItem("crow_connection_status");
			const statusMap = savedStatus ? JSON.parse(savedStatus) : {};
			statusMap.web = "connected";
			localStorage.setItem("crow_connection_status", JSON.stringify(statusMap));

			toast.success("Web source connected!");
			router.push("/connect-sources");
		} catch {
			toast.error("Failed to connect. Please try again.");
		}
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

					<div className="pt-4 pb-4">
						<Button
							variant="solid"
							onClick={handleConnect}
							disabled={submitSource.isPending || isGenerating}
							className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50"
						>
							{submitSource.isPending ? "Connecting..." : isGenerating ? "Generating key..." : "Connect"}
						</Button>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
