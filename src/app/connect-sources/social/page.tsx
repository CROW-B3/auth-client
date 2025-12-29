"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, Select, Checkbox, SyncStatusCard, CompanyPageButton, TagInput } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";
import { FaXTwitter, FaReddit, FaInstagram, FaTiktok } from "react-icons/fa6";
import { HiNewspaper } from "react-icons/hi2";
import toast from "react-hot-toast";

export default function ConnectSocialPage() {
	const router = useRouter();
	const [keywords, setKeywords] = useState<string[]>(["checkout", "queue"]);
	const [brands, setBrands] = useState<string[]>(["CROW Sneakers"]);
	const [region, setRegion] = useState("");
	const [connectedAccounts, setConnectedAccounts] = useState({
		twitter: false,
		reddit: false,
		instagram: false,
		tiktok: false,
		news: false,
	});
	const [sources, setSources] = useState({
		twitter: true,
		reddit: true,
		instagram: false,
		tiktok: false,
		news: true,
	});


	const handleStartSync = () => {
		const savedStatus = localStorage.getItem("crow_connection_status");
		const statusMap = savedStatus ? JSON.parse(savedStatus) : {};
		statusMap.social = "connected";
		localStorage.setItem("crow_connection_status", JSON.stringify(statusMap));

		toast.success("Starting social sync...");
		router.push("/connect-sources");
	};

	const handleSkip = () => {
		toast.success("Skipping social setup. You can connect later in Settings.");
		router.push("/connect-sources");
	};

	const handleConnectAccount = (platform: "twitter" | "reddit" | "instagram" | "tiktok" | "news") => {
		toast.success(`Opening ${platform} authorization...`);
		setConnectedAccounts({ ...connectedAccounts, [platform]: true });
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 relative">
			<AnimatedBackground />

			<Navbar logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }} />

			<main className="flex-grow flex flex-col items-center relative z-10 w-full px-6 py-8 pb-20 max-w-5xl mx-auto">
				<div className="w-full max-w-[850px]">
					<PageHeader
						label="SETUP"
						title="Connect Social."
						description="Track mentions and sentiment tied to your operations."
					/>
					<motion.div
						className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						<div className="flex flex-col gap-5 justify-center">
							<TagInput
								label="Keywords"
								placeholder="e.g., refund"
								tags={keywords}
								onTagsChange={setKeywords}
								helpText="Use operational terms customers mention."
							/>

							<TagInput
								label="Brands / products"
								placeholder="e.g., Acme Retail"
								tags={brands}
								onTagsChange={setBrands}
								helpText="Optional, improves relevance."
							/>

							<div className="space-y-1.5">
								<label className="text-xs font-medium text-gray-300 ml-1 block">
									Regions / languages
								</label>
								<Select
									value={region}
									onChange={setRegion}
									options={[
										{ value: "", label: "All regions / All languages" },
										{ value: "na-en", label: "North America (EN)" },
										{ value: "eu-multi", label: "Europe (EN, FR, DE)" },
										{ value: "ap-multi", label: "Asia Pacific (JP, CN)" },
									]}
								/>
								<p className="text-[10px] text-gray-500 ml-1">
									Limit to specific markets if needed.
								</p>
							</div>

							{(sources.twitter || sources.reddit || sources.instagram || sources.tiktok || sources.news) && (
								<div className="space-y-1.5">
									<label className="text-xs font-medium text-gray-300 ml-1 block">
										Company Pages
									</label>
									<div className="grid grid-cols-2 gap-2">
										{sources.twitter && (
											<CompanyPageButton
												platform="X / Twitter"
												icon={<FaXTwitter />}
												onClick={() => handleConnectAccount("twitter")}
												connected={connectedAccounts.twitter}
											/>
										)}
										{sources.reddit && (
											<CompanyPageButton
												platform="Reddit"
												icon={<FaReddit />}
												onClick={() => handleConnectAccount("reddit")}
												connected={connectedAccounts.reddit}
											/>
										)}
										{sources.instagram && (
											<CompanyPageButton
												platform="Instagram"
												icon={<FaInstagram />}
												onClick={() => handleConnectAccount("instagram")}
												connected={connectedAccounts.instagram}
											/>
										)}
										{sources.tiktok && (
											<CompanyPageButton
												platform="TikTok"
												icon={<FaTiktok />}
												onClick={() => handleConnectAccount("tiktok")}
												connected={connectedAccounts.tiktok}
											/>
										)}
										{sources.news && (
											<CompanyPageButton
												platform="News"
												icon={<HiNewspaper />}
												onClick={() => handleConnectAccount("news")}
												connected={connectedAccounts.news}
											/>
										)}
									</div>
									<p className="text-[10px] text-gray-500 ml-1">
										Connect your brand accounts to track direct mentions.
									</p>
								</div>
							)}
						</div>

						<div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col h-full shadow-card-glow">
							<h3 className="text-xs font-semibold text-white tracking-tight uppercase text-violet-200/70 mb-4">
								Sources
							</h3>
							<div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6">
								<Checkbox
									label="X / Twitter"
									checked={sources.twitter}
									onChange={(e) => setSources({ ...sources, twitter: e.target.checked })}
								/>
								<Checkbox
									label="Reddit"
									checked={sources.reddit}
									onChange={(e) => setSources({ ...sources, reddit: e.target.checked })}
								/>
								<Checkbox
									label="Instagram"
									checked={sources.instagram}
									onChange={(e) => setSources({ ...sources, instagram: e.target.checked })}
								/>
								<Checkbox
									label="TikTok"
									checked={sources.tiktok}
									onChange={(e) => setSources({ ...sources, tiktok: e.target.checked })}
								/>
								<Checkbox
									label="News"
									checked={sources.news}
									onChange={(e) => setSources({ ...sources, news: e.target.checked })}
								/>
							</div>
							<SyncStatusCard />
						</div>
					</motion.div>

					<motion.div
						className="w-full flex flex-col items-center gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
					>
						<div className="flex items-center gap-4 w-full justify-center">
							<Button
								variant="primary"
								size="xl"
								onClick={handleStartSync}
							>
								Start sync
							</Button>
							<Button
								variant="ghost"
								size="lg"
								onClick={handleSkip}
							>
								Skip for now
							</Button>
						</div>
						<button
							type="button"
							className="text-xs text-gray-500 hover:text-violet-400 transition-colors underline decoration-gray-700 hover:decoration-violet-500/50 underline-offset-2"
							onClick={() => toast.info("Documentation coming soon!")}
						>
							How social signals are used
						</button>
					</motion.div>
				</div>
			</main>
		</div>
	);
}
