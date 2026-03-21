"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar, PageHeader, Button, Input } from "@b3-crow/ui-kit";
import { LuLink, LuUpload, LuFile, LuX, LuArrowRight, LuSkipForward, LuCheck } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitProducts, useSkipProducts, useOnboardingGuard } from "@/hooks/use-onboarding";

type ProductUploadMethod = "url" | "file" | null;

const VALID_FILE_MIME_TYPES = ["application/json", "text/csv", "text/plain"];
const VALID_FILE_EXTENSIONS = [".json", ".csv"];

const FADE_IN_ANIMATION = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function isValidFileType(file: File): boolean {
	const hasValidExtension = VALID_FILE_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));
	return VALID_FILE_MIME_TYPES.includes(file.type) || hasValidExtension;
}

function readFileContentAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsText(file);
	});
}

function determineSourceTypeFromFile(file: File): "csv" | "json" {
	return file.name.endsWith(".csv") ? "csv" : "json";
}

async function resolveProductSourceInput(
	activeMethod: ProductUploadMethod,
	feedUrl: string,
	uploadedFile: File | null,
): Promise<{ sourceType: "url" | "csv" | "json"; sourceValue: string } | null> {
	if (activeMethod === "url") return { sourceType: "url", sourceValue: feedUrl };

	if (!uploadedFile) return null;

	const sourceType = determineSourceTypeFromFile(uploadedFile);
	const sourceValue = await readFileContentAsText(uploadedFile);
	return { sourceType, sourceValue };
}

function triggerBackgroundProductCrawl(organizationId: string, onboardingId: string, sourceType: string, sourceValue: string): void {
	fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/crawler-jobs/crawl-now`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ organizationId, onboardingId, sourceType, sourceValue }),
	})
		.then(() => toast.success("Product crawl started in the background"))
		.catch(() => toast.error("Failed to start crawling"));
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

function SectionDividerWithLabel() {
	return (
		<div className="flex items-center gap-4">
			<div className="flex-1 h-px bg-white/10" />
			<span className="text-xs text-gray-500 font-medium">or</span>
			<div className="flex-1 h-px bg-white/10" />
		</div>
	);
}

function UploadedFilePreview({ file, onRemoveFile }: { file: File; onRemoveFile: () => void }) {
	return (
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
					<p className="text-sm text-gray-200 font-medium">{file.name}</p>
					<p className="text-xs text-gray-500">
						{(file.size / 1024).toFixed(1)} KB
					</p>
				</div>
			</div>
			<button
				onClick={onRemoveFile}
				className="p-2 hover:bg-white/10 rounded-lg transition-colors"
			>
				<LuX className="w-4 h-4 text-gray-400" />
			</button>
		</motion.div>
	);
}

function FileUploadDropzone({ isDisabled, onClickUpload }: { isDisabled: boolean; onClickUpload: () => void }) {
	return (
		<button
			onClick={onClickUpload}
			disabled={isDisabled}
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
	);
}

function FileUploadSection({
	fileInputRef,
	uploadedFile,
	isDisabled,
	onSelectFile,
	onRemoveFile,
}: {
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	uploadedFile: File | null;
	isDisabled: boolean;
	onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onRemoveFile: () => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-medium text-gray-200 flex items-center gap-2">
				<LuUpload className="w-4 h-4" />
				Upload file
			</label>
			<input
				ref={fileInputRef}
				type="file"
				accept=".json,.csv,application/json,text/csv"
				onChange={onSelectFile}
				className="hidden"
				disabled={isDisabled}
			/>
			{uploadedFile
				? <UploadedFilePreview file={uploadedFile} onRemoveFile={onRemoveFile} />
				: <FileUploadDropzone isDisabled={isDisabled} onClickUpload={() => fileInputRef.current?.click()} />
			}
		</div>
	);
}

function ConnectionReadyIndicator({ activeMethod }: { activeMethod: ProductUploadMethod }) {
	if (!activeMethod) return null;

	return (
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
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [activeUploadMethod, setActiveUploadMethod] = useState<ProductUploadMethod>(null);
	const [feedUrl, setFeedUrl] = useState("");
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [urlValidationError, setUrlValidationError] = useState("");

	const { onboardingId } = useOnboardingStore();
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
		setActiveUploadMethod(value ? "url" : null);
		if (urlValidationError) setUrlValidationError("");
	};

	const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (!isValidFileType(file)) { toast.error("Please upload a CSV or JSON file"); return; }

		setUploadedFile(file);
		setActiveUploadMethod("file");
		setFeedUrl("");
		setUrlValidationError("");
		toast.success(`${file.name} selected`);
	};

	const handleRemoveFile = () => {
		setUploadedFile(null);
		setActiveUploadMethod(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleClickContinue = async () => {
		if (!activeUploadMethod) { toast.error("Please provide a product feed URL or upload a file"); return; }
		if (activeUploadMethod === "url" && !validateFeedUrl(feedUrl)) return;
		if (!onboardingId) return;

		const sourceInput = await resolveProductSourceInput(activeUploadMethod, feedUrl, uploadedFile);
		if (!sourceInput) { toast.error("No file selected"); return; }

		try {
			triggerBackgroundProductCrawl(onboardingId, onboardingId, sourceInput.sourceType, sourceInput.sourceValue);
			await submitProducts.mutateAsync({ onboardingId, input: sourceInput });
			router.push("/setup-components");
		} catch {
			toast.error("Failed to start crawling. Please try again.");
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
					description="Import your product catalog via URL or file upload."
				/>
				<motion.div className="w-full space-y-6" {...FADE_IN_ANIMATION} transition={{ duration: 0.5, delay: 0.3 }}>
					<ProductFeedUrlInput
						feedUrl={feedUrl}
						urlValidationError={urlValidationError}
						isDisabled={activeUploadMethod === "file"}
						onChangeFeedUrl={handleChangeFeedUrl}
					/>
					<SectionDividerWithLabel />
					<FileUploadSection
						fileInputRef={fileInputRef}
						uploadedFile={uploadedFile}
						isDisabled={activeUploadMethod === "url"}
						onSelectFile={handleSelectFile}
						onRemoveFile={handleRemoveFile}
					/>
					<ConnectionReadyIndicator activeMethod={activeUploadMethod} />
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
