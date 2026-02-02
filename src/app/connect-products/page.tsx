"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, Input } from "@b3-crow/ui-kit";
import { LuLink, LuUpload, LuFile, LuX, LuArrowRight, LuSkipForward, LuCheck } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitProducts, useOnboardingGuard } from "@/hooks/use-onboarding";
import { CrawlProgressPopover } from "@/components/crawl-progress-popover";

type UploadMethod = "url" | "file" | null;

interface CrawlJob {
  jobId: string;
  progressUrl: string;
}

export default function ConnectProductsPage() {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [activeMethod, setActiveMethod] = useState<UploadMethod>(null);
	const [feedUrl, setFeedUrl] = useState("");
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [urlError, setUrlError] = useState("");
	const [crawlJob, setCrawlJob] = useState<CrawlJob | null>(null);
	const [isCrawling, setIsCrawling] = useState(false);

	const { onboardingId } = useOnboardingStore();
	const submitProducts = useSubmitProducts();

	// Route guard
	const guard = useOnboardingGuard("products");

	useEffect(() => {
		if (guard.data?.shouldRedirect && guard.data.redirectTo) {
			router.push(guard.data.redirectTo);
		}
	}, [guard.data, router]);

	const validateUrl = (url: string): boolean => {
		if (!url.trim()) {
			setUrlError("Please enter a URL");
			return false;
		}
		try {
			new URL(url);
			setUrlError("");
			return true;
		} catch {
			setUrlError("Please enter a valid URL");
			return false;
		}
	};

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setFeedUrl(value);
		setActiveMethod(value ? "url" : null);
		if (urlError) setUrlError("");
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validTypes = ["application/json", "text/csv", "text/plain"];
		const validExtensions = [".json", ".csv"];
		const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

		if (!validTypes.includes(file.type) && !hasValidExtension) {
			toast.error("Please upload a CSV or JSON file");
			return;
		}

		setUploadedFile(file);
		setActiveMethod("file");
		setFeedUrl("");
		setUrlError("");
		toast.success(`${file.name} selected`);
	};

	const handleRemoveFile = () => {
		setUploadedFile(null);
		setActiveMethod(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const readFileContent = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error("Failed to read file"));
			reader.readAsText(file);
		});
	};

	const handleContinue = async () => {
		if (!activeMethod) {
			toast.error("Please provide a product feed URL or upload a file");
			return;
		}

		if (activeMethod === "url" && !validateUrl(feedUrl)) {
			return;
		}

		try {
			setIsCrawling(true);

			if (onboardingId) {
				let sourceType: "url" | "csv" | "json";
				let sourceValue: string;

				if (activeMethod === "url") {
					sourceType = "url";
					sourceValue = feedUrl;
				} else if (uploadedFile) {
					sourceType = uploadedFile.name.endsWith(".csv") ? "csv" : "json";
					sourceValue = await readFileContent(uploadedFile);
				} else {
					toast.error("No file selected");
					setIsCrawling(false);
					return;
				}

				// Call the crawl-now endpoint for real-time progress
				const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/crawler-jobs/crawl-now`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						organizationId: onboardingId, // Using onboardingId temporarily
						onboardingId,
						sourceType,
						sourceValue,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to start crawl");
				}

				const data = await response.json();
				setCrawlJob({ jobId: data.job.id, progressUrl: data.progressUrl });

				// Also submit to onboarding service
				await submitProducts.mutateAsync({
					onboardingId,
					input: { sourceType, sourceValue },
				});
			}
		} catch (error) {
			toast.error("Failed to start crawling. Please try again.");
			setIsCrawling(false);
			setCrawlJob(null);
		}
	};

	const handleCrawlComplete = (success: boolean) => {
		setIsCrawling(false);
		if (success) {
			toast.success("Products crawled successfully!");
			setTimeout(() => router.push("/connect-sources"), 2000);
		} else {
			toast.error("Crawling failed. Please try again.");
		}
	};

	const handleSkip = () => {
		router.push("/connect-sources");
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center relative z-10 w-full px-4 pb-20 max-w-lg mx-auto">
				<PageHeader
					label="Products"
					title="Connect your products."
					description="Import your product catalog via URL or file upload."
				/>

				<motion.div
					className="w-full space-y-6"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
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
							onChange={handleUrlChange}
							error={urlError}
							inputSize="md"
							disabled={activeMethod === "file"}
						/>
						<p className="text-xs text-gray-500 px-1">
							Supports JSON or CSV endpoints
						</p>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex-1 h-px bg-white/10" />
						<span className="text-xs text-gray-500 font-medium">or</span>
						<div className="flex-1 h-px bg-white/10" />
					</div>

					<div className="space-y-2">
						<label className="text-xs font-medium text-gray-200 flex items-center gap-2">
							<LuUpload className="w-4 h-4" />
							Upload file
						</label>

						<input
							ref={fileInputRef}
							type="file"
							accept=".json,.csv,application/json,text/csv"
							onChange={handleFileSelect}
							className="hidden"
							disabled={activeMethod === "url"}
						/>

						{uploadedFile ? (
							<motion.div
								className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-xl"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-violet-500/20 rounded-lg">
										<LuFile className="w-5 h-5 text-violet-400" />
									</div>
									<div>
										<p className="text-sm text-gray-200 font-medium">{uploadedFile.name}</p>
										<p className="text-xs text-gray-500">
											{(uploadedFile.size / 1024).toFixed(1)} KB
										</p>
									</div>
								</div>
								<button
									onClick={handleRemoveFile}
									className="p-2 hover:bg-white/10 rounded-lg transition-colors"
								>
									<LuX className="w-4 h-4 text-gray-400" />
								</button>
							</motion.div>
						) : (
							<button
								onClick={() => fileInputRef.current?.click()}
								disabled={activeMethod === "url"}
								className="w-full p-8 border-2 border-dashed border-white/10 rounded-xl hover:border-violet-500/50 hover:bg-white/[0.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
							>
								<div className="flex flex-col items-center gap-2">
									<div className="p-3 bg-white/[0.05] rounded-xl group-hover:bg-violet-500/20 transition-colors">
										<LuUpload className="w-6 h-6 text-gray-400 group-hover:text-violet-400 transition-colors" />
									</div>
									<p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
										Click to upload CSV or JSON
									</p>
									<p className="text-xs text-gray-600">
										Max file size: 10MB
									</p>
								</div>
							</button>
						)}
					</div>

					{activeMethod && !crawlJob && (
						<motion.div
							className="flex items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<LuCheck className="w-4 h-4 text-violet-400" />
							<span className="text-sm text-violet-300">
								{activeMethod === "url" ? "URL provided" : "File selected"} - ready to connect
							</span>
						</motion.div>
					)}

					{crawlJob && (
						<CrawlProgressPopover
							jobId={crawlJob.jobId}
							progressUrl={crawlJob.progressUrl}
							onComplete={handleCrawlComplete}
						/>
					)}
				</motion.div>

				<motion.div
					className="w-full flex flex-col gap-4 mt-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.5 }}
				>
					<Button
						variant="solid"
						className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50"
						arrowIcon={<LuArrowRight />}
						onClick={handleContinue}
						disabled={submitProducts.isPending}
					>
						{submitProducts.isPending ? "Connecting..." : "Continue"}
					</Button>

					<Button
						variant="ghost"
						className="w-full text-gray-500 hover:text-white"
						arrowIcon={<LuSkipForward />}
						onClick={handleSkip}
						disabled={submitProducts.isPending}
					>
						Skip for now
					</Button>
				</motion.div>
			</main>
		</div>
	);
}
