"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, PackageManagerSelector, type PackageManager, CodeBlock, ApiKeyInput } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ConnectWebPage() {
	const router = useRouter();
	const [packageManager, setPackageManager] = useState<PackageManager>("bun");

	// API key should be fetched from backend or environment variable
	const apiKey = process.env.NEXT_PUBLIC_CROW_API_KEY || "crow_sk_demo_placeholder";

	const installCommands: Record<PackageManager, string> = {
		bun: "bun add @crow/web-sdk",
		npm: "npm install @crow/web-sdk",
		pnpm: "pnpm add @crow/web-sdk",
		yarn: "yarn add @crow/web-sdk",
	};

	const initCode = `import { CrowSDK } from '@crow/web-sdk';

const crow = new CrowSDK({
  apiKey: '${apiKey}',
  orgId: 'your-org-id' // optional
});

// Track page views
crow.track('page_view', {
  path: window.location.pathname
});`;

	const handleConnect = () => {
		const savedStatus = localStorage.getItem("crow_connection_status");
		const statusMap = savedStatus ? JSON.parse(savedStatus) : {};
		statusMap.web = "connected";
		localStorage.setItem("crow_connection_status", JSON.stringify(statusMap));

		toast.success("Web source connected!");
		router.push("/connect-sources");
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
						<CodeBlock code={installCommands[packageManager]} showCopy={true} />
					</div>

					{/* Initialize Section */}
					<div className="space-y-2">
						<label className="text-xs font-medium text-gray-200 block">Initialize</label>
						<CodeBlock code={initCode} />
						<p className="text-xs text-gray-500 px-1">Initialize once at app startup.</p>
					</div>

					<div className="pt-4 pb-4">
						<Button
							variant="solid"
							onClick={handleConnect}
							className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
						>
							Connect
						</Button>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
