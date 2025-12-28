"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, Input, Select, RunAgentCard } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ConnectCCTVPage() {
	const router = useRouter();
	const [siteName, setSiteName] = useState("");
	const [region] = useState("");
	const [cameraGroup, setCameraGroup] = useState("");
	const [isConnected, setIsConnected] = useState(false);

	const agentCommand = `crow-cctv-agent start --site "${siteName || "<site-name>"}" --region ${region || "<region>"}${cameraGroup ? ` --group "${cameraGroup}"` : ""}`;

	const handleContinue = () => {
		if (!isConnected) {
			toast.error("Please verify connection first");
			return;
		}
		toast.success("CCTV source connected!");
		router.push("/connect-sources");
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
									defaultValue={region}
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

						<div className="mt-2">
							<RunAgentCard command={agentCommand} />
						</div>

						<div>
							<Button
								variant="solid"
								onClick={handleContinue}
								disabled={!isConnected}
								className={`w-full text-sm ${
									isConnected
										? "bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
										: "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
								}`}
							>
								Continue
							</Button>
						</div>
					</motion.div>
				</div>
			</main>
		</div>
	);
}
