"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, ConnectionOption, ConnectionOptionStatus } from "@b3-crow/ui-kit";
import { LuGlobe, LuVideo, LuArrowRight, LuSkipForward } from "react-icons/lu";
import { TbSocial } from "react-icons/tb";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useOnboardingGuard } from "@/hooks/use-onboarding";

interface ConnectionSource {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	status: ConnectionOptionStatus;
}

const STORAGE_KEY = "crow_connection_status";

export default function ConnectSourcesPage() {
	const router = useRouter();
	const [sources, setSources] = useState<ConnectionSource[]>([
		{
			id: "web",
			title: "Connect Web",
			description: "Install the tracker and verify events.",
			icon: <LuGlobe className="text-[20px]" />,
			status: "not_started",
		},
		{
			id: "cctv",
			title: "Connect CCTV",
			description: "Register cameras or streaming endpoint.",
			icon: <LuVideo className="text-[20px]" />,
			status: "not_started",
		},
		{
			id: "social",
			title: "Connect Social",
			description: "Authorize channels and keywords.",
			icon: <TbSocial className="text-[20px]" />,
			status: "not_started",
		},
	]);

	// Route guard
	const guard = useOnboardingGuard("sources");

	useEffect(() => {
		if (guard.data?.shouldRedirect && guard.data.redirectTo) {
			router.push(guard.data.redirectTo);
		}
	}, [guard.data, router]);

	useEffect(() => {
		const savedStatus = localStorage.getItem(STORAGE_KEY);
		if (savedStatus) {
			try {
				const statusMap = JSON.parse(savedStatus) as Record<string, ConnectionOptionStatus>;
				setSources((prevSources) =>
					prevSources.map((source) => ({
						...source,
						status: statusMap[source.id] || source.status,
					}))
				);
			} catch (error) {
				console.error("Failed to parse connection status:", error);
			}
		}
	}, []);

	const connectedCount = useMemo(
		() => sources.filter((s) => s.status === "connected").length,
		[sources]
	);

	const handleSourceClick = (sourceId: string) => {
		router.push(`/connect-sources/${sourceId}`);
	};

	const handleContinue = () => {
		if (connectedCount === 0) {
			toast.error("Please connect at least one source to continue");
			return;
		}
		router.push("/invite-team");
	};

	const handleSkip = () => {
		router.push("/invite-team");
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-4 pt-4 pb-20 max-w-lg mx-auto">
				<PageHeader
					label="Setup"
					title="Connect your sources."
					description="Recommended — you can skip and connect later."
				/>

				<motion.p
					className="text-gray-600 text-xs font-medium mb-8"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					{connectedCount}/3 sources connected
				</motion.p>

				<motion.div
					className="w-full bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_-10px_rgba(124,58,237,0.15)] backdrop-blur-sm mb-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					{sources.map((source, index) => (
						<ConnectionOption
							key={source.id}
							icon={source.icon}
							title={source.title}
							description={source.description}
							status={source.status}
							onClick={() => handleSourceClick(source.id)}
							animationDelay={0.5 + index * 0.1}
						/>
					))}
				</motion.div>

				<motion.div
					className="w-full flex flex-col gap-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.9 }}
				>
					<Button
						variant="solid"
						className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover"
						arrowIcon={<LuArrowRight />}
						onClick={handleContinue}
					>
						Continue
					</Button>

					<Button
						variant="ghost"
						className="w-full text-gray-500 hover:text-white"
						arrowIcon={<LuSkipForward />}
						onClick={handleSkip}
					>
						Skip setup
					</Button>
				</motion.div>
			</main>
		</div>
	);
}
