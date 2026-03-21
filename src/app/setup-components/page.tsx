"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, ConnectionOption } from "@b3-crow/ui-kit";
import { LuGlobe, LuVideo, LuSkipForward } from "react-icons/lu";
import { TbSocial } from "react-icons/tb";
import { motion } from "framer-motion";
import { useOnboardingStore } from "@/stores/onboarding-store";


type ModuleType = "web" | "cctv" | "social";

interface ConnectionSource {
	id: ModuleType;
	title: string;
	description: string;
	icon: React.ReactNode;
}

const ALL_SOURCES: ConnectionSource[] = [
	{
		id: "web",
		title: "Connect Web",
		description: "Install the tracker and verify events.",
		icon: <LuGlobe className="text-[20px]" />,
	},
	{
		id: "cctv",
		title: "Connect CCTV",
		description: "Register cameras or streaming endpoint.",
		icon: <LuVideo className="text-[20px]" />,
	},
	{
		id: "social",
		title: "Connect Social",
		description: "Authorize channels and keywords.",
		icon: <TbSocial className="text-[20px]" />,
	},
];

function getSelectedSources(modules: Record<ModuleType, boolean> | null): ConnectionSource[] {
	if (!modules) return [];

	return ALL_SOURCES.filter((source) => modules[source.id] === true);
}

export default function ConnectSourcesPage() {
	const router = useRouter();
	const { selectedPlans, onboardingId } = useOnboardingStore();
	const selectedModules: Record<ModuleType, boolean> | null = selectedPlans.length > 0
		? { web: selectedPlans.includes("web"), cctv: selectedPlans.includes("cctv"), social: selectedPlans.includes("social") }
		: null;
	const selectedSources = getSelectedSources(selectedModules);
	const dataLoaded = selectedModules != null;

	const handleSourceClick = (sourceId: ModuleType) => {
		router.push(`/setup-components/${sourceId}`);
	};

	const handleSkip = async () => {
		if (onboardingId) {
			try {
				const apiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";
				await fetch(`${apiUrl}/api/v1/auth/onboarding/${onboardingId}/step/sources/skip`, {
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				});
			} catch {
				// proceed anyway
			}
		}
		// Use hard navigation so middleware re-evaluates completedSteps from DB
		window.location.href = "/invite-team";
	};

	useEffect(() => {
		if (dataLoaded && selectedSources.length === 0) {
			router.push("/invite-team");
		}
	}, [dataLoaded, selectedSources, router]);

	if (!dataLoaded || selectedSources.length === 0) {
		return null;
	}

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
					description="Connect the modules you selected. You can skip and connect later."
				/>

				<motion.div
					className="w-full bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_-10px_rgba(124,58,237,0.15)] backdrop-blur-sm mb-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					{selectedSources.map((source, index) => (
						<ConnectionOption
							key={source.id}
							icon={source.icon}
							title={source.title}
							description={source.description}
							status="not_started"
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
