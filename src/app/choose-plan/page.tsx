"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	AnimatedBackground,
	Navbar,
	NavLink,
	PageHeader,
	Footer,
	PlanCard,
	SegmentedControl,
	CheckoutSummary,
	ToggleOption
} from "@b3-crow/ui-kit";
import toast from "react-hot-toast";
import { LuArrowRight, LuLoader } from "react-icons/lu";
import { PLANS, type PlanType, type BillingPeriod } from "@/config/plans";

export default function ChoosePlanPage() {
	const router = useRouter();
	const [selectedPlans, setSelectedPlans] = useState<PlanType[]>([]);
	const [billing, setBilling] = useState<BillingPeriod>("annual");
	const [autoScale, setAutoScale] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handlePlanToggle = (plan: PlanType, checked: boolean) => {
		if (checked) {
			setSelectedPlans((prev) => [...prev, plan]);
			toast.success(`${plan.toUpperCase()} module added!`);
		} else {
			setSelectedPlans((prev) => prev.filter((p) => p !== plan));
			toast.success(`${plan.toUpperCase()} module removed!`);
		}
	};

	const handleProceedToPayment = async () => {
		if (selectedPlans.length === 0) {
			toast.error("Please select at least one module");
			return;
		}

		setIsLoading(true);
		toast.success("Proceeding to payment...");

		await new Promise((resolve) => setTimeout(resolve, 1500));

		const params = new URLSearchParams({
			plans: selectedPlans.join(','),
			billing: billing,
			autoScale: autoScale.toString(),
		});

		router.push(`/checkout?${params.toString()}`);
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
				rightContent={
					<span className="text-gray-500 flex items-center gap-2">
						Already have an account? <NavLink href="/login">Log in</NavLink>
					</span>
				}
			/>

			<main className="flex-grow flex flex-col items-center relative z-10 w-full px-4 max-w-7xl mx-auto">
				<PageHeader
					label="Plan"
					title="Select a plan."
					description="Plans scale with seats, connected sources, monthly events, and retention.
You can change this later."
				/>

				<motion.div
					className="w-full max-w-5xl flex flex-row items-end justify-end gap-8 sm:gap-12 md:gap-16 mb-6 flex-wrap"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<SegmentedControl
						size="sm"
						options={[
							{ label: "Monthly", value: "monthly" },
							{ label: "Annual", value: "annual" },
						]}
						defaultValue="annual"
						onChange={setBilling}
						label="Billing"
						description="Annual includes a discount."
					/>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full max-w-5xl mb-8 items-stretch">
					{PLANS.map((plan, index) => (
						<PlanCard
							key={plan.type}
							variant="plan"
							showCheckbox={true}
							selected={selectedPlans.includes(plan.type)}
							onCheckboxChange={(checked) => handlePlanToggle(plan.type, checked)}
							header={plan.header}
							price={{
								amount: billing === "annual" ? "$50" : "$60",
								period: "mo",
							}}
							featuresTitle={plan.featuresTitle}
							padding="sm"
							features={plan.features}
							animationDelay={index * 0.1}
							className="flex flex-col w-full h-full"
						/>
					))}
				</div>

				<motion.div
					className="w-full mb-3 pl-36"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.6 }}
				>
					<ToggleOption
						label="Auto-scale usage"
						description="If you exceed your included usage, extra usage is billed automatically."
						checked={autoScale}
						onChange={setAutoScale}
					/>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.7 }}
				>
					<CheckoutSummary
						variant="dark"
						items={[
							{
								label: "COMPONENTS",
								value: `${selectedPlans.length}/3 Selected`,
								highlightValue: true,
							},
							{
								label: "TOTAL INCLUDED USAGE",
								value: selectedPlans.length > 0
									? `${selectedPlans.length}M interactions, ${selectedPlans.length}M patterns`
									: "0 interactions, 0 patterns",
							},
							{
								label: "ADD-ONS",
								value: "0 packs added",
							},
						]}
						total={{
							amount: selectedPlans.length > 0
								? `$${selectedPlans.length * (billing === "annual" ? 50 : 60)}`
								: "$—",
							period: "mo",
						}}
						primaryAction={{
							text: "Continue to checkout",
							icon: isLoading ? (
								<LuLoader className="w-4 h-4 animate-spin" />
							) : (
								<LuArrowRight className="w-4 h-4" />
							),
							onClick: handleProceedToPayment,
						}}
						secondaryActions={{
							left: "Change anytime.",
							right: "Talk to sales",
							onRightClick: () => toast.success("Opening sales chat..."),
						}}
						size="sm"
					/>
				</motion.div>
			</main>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.9 }}
			>
				<Footer
					invitePrefix="Each module includes a discount."
					inviteText="Compare modules"
					inviteHref="/compare-modules"
					termsPrefix="You can add or remove modules later in Settings."
					termsLinks={[]}
				/>
			</motion.div>
		</div>
	);
}
