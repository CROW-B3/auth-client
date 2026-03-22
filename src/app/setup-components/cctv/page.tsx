"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, Input, Select, RunAgentCard } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitSource } from "@/hooks/use-onboarding";

export default function ConnectCCTVPage() {
	const router = useRouter();
	const [siteName, setSiteName] = useState("");
	const [region, setRegion] = useState("");
	const [cameraGroup, setCameraGroup] = useState("");
	const [isConnected, setIsConnected] = useState(false);

	const { onboardingId, setConnectionStatus } = useOnboardingStore();
	const submitSource = useSubmitSource();

	const sanitizeShellArg = (value: string): string => {
		return value.replace(/(["\\$`])/g, "\\$1");
	};

	const safeSiteName = sanitizeShellArg(siteName || "<site-name>");
	const safeRegion = sanitizeShellArg(region || "<region>");
	const safeCameraGroup = cameraGroup ? sanitizeShellArg(cameraGroup) : "";

	const agentCommand = `crow-cctv-agent start --site "${safeSiteName}" --region "${safeRegion}"${safeCameraGroup ? ` --group "${safeCameraGroup}"` : ""}`;

	const handleVerifyConnection = () => {
		if (!siteName.trim()) {
			toast.error("Please enter a site name");
			return;
		}
		if (!region) {
			toast.error("Please select a region");
			return;
		}
		toast.success("Connection verified successfully!");
		setIsConnected(true);
	};

	const handleContinue = async () => {
		if (!isConnected) {
			toast.error("Please verify connection first");
			return;
		}

		try {
			if (onboardingId) {
				await submitSource.mutateAsync({
					onboardingId,
					input: { sourceType: "cctv", apiKeyId: `cctv-${siteName}-${region}` },
				});
			}

			setConnectionStatus("cctv", "connected");

			const savedStatus = localStorage.getItem("crow_connection_status");
			let statusMap: Record<string, string> = {};
			try { statusMap = savedStatus ? JSON.parse(savedStatus) : {}; } catch { /* ignore corrupt data */ }
			statusMap.cctv = "connected";
			localStorage.setItem("crow_connection_status", JSON.stringify(statusMap));

			toast.success("CCTV source connected!");
			router.push("/setup-components");
		} catch {
			toast.error("Failed to connect. Please try again.");
		}
	};

	return (
		<div className="h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden relative">
			<AnimatedBackground />

			<Navbar logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }} />

			<main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-6 pb-6 max-w-5xl mx-auto h-full overflow-hidden">
				<div className="w-full max-w-[800px] flex flex-col justify-center h-full max-h-[850px]">
					<PageHeader
						label="SETUP"
						title="Connect CCTV."
						description="Register a site and start the CCTV agent."
					/>

					<motion.div
						className="w-full flex flex-col gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						<div className="grid grid-cols-12 gap-3">
							<div className="col-span-7">
								<Input
									inputSize="md"
									label="Site / Store name"
									placeholder="e.g., Store - NY-04"
									value={siteName}
									onChange={(e) => setSiteName(e.target.value)}
								/>
							</div>
							<div className="col-span-5">
								<Select
									label="Location / Region"
									value={region}
									onChange={setRegion}
									options={[
										{ value: "", label: "Select region" },
										{ value: "us-east", label: "North America (East)" },
										{ value: "us-west", label: "North America (West)" },
										{ value: "eu-london", label: "Europe (London)" },
										{ value: "ap-tokyo", label: "Asia Pacific (Tokyo)" },
									]}
								/>
							</div>
							<div className="col-span-12">
								<Input
									inputSize="md"
									label="Camera group name"
									placeholder="e.g., Front-of-house cameras"
									value={cameraGroup}
									onChange={(e) => setCameraGroup(e.target.value)}
								/>
							</div>
						</div>

						<div className="mt-2 space-y-3">
							<div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
								<h3 className="text-sm font-medium text-white">Prerequisites</h3>
								<ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
									<li>ffmpeg installed and available in PATH</li>
									<li>Node.js 18+ installed</li>
									<li>Python 3.x + opencv-python (optional, for intelligent keyframe selection)</li>
								</ul>
								<h3 className="text-sm font-medium text-white mt-3">Install CCTV CLI</h3>
								<div className="rounded-md bg-black/40 border border-white/5 p-3 font-mono text-xs text-gray-300">
									npm install -g @b3-crow/cctv-cli
								</div>
								<h3 className="text-sm font-medium text-white mt-3">Stream to CROW</h3>
								<div className="rounded-md bg-black/40 border border-white/5 p-3 font-mono text-xs text-gray-300 break-all">
									cctv stream --url wss://dev.cctv.crowai.dev/ws --apiKey crow_xxx
								</div>
								<p className="text-xs text-gray-500">
									The CLI extracts 1 frame/sec via ffmpeg and streams over WebSocket to the ingest service.
								</p>
							</div>
							<RunAgentCard command={agentCommand} />
						</div>

						<div className="space-y-3">
							<Button
								variant="solid"
								onClick={handleVerifyConnection}
								disabled={isConnected}
								className={`w-full text-sm ${
									!isConnected
										? "bg-blue-600 hover:bg-blue-700"
										: "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
								}`}
							>
								{isConnected ? "Connection Verified" : "Verify Connection"}
							</Button>
							<Button
								variant="solid"
								onClick={handleContinue}
								disabled={!isConnected || submitSource.isPending}
								className={`w-full text-sm ${
									isConnected && !submitSource.isPending
										? "bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
										: "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
								}`}
							>
								{submitSource.isPending ? "Connecting..." : "Continue"}
							</Button>
						</div>
					</motion.div>
				</div>
			</main>
		</div>
	);
}
