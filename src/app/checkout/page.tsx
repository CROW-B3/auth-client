"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBackground, Button, Input, Navbar, PageHeader, Select, OrderSummaryCard, FormSection } from "@b3-crow/ui-kit";
import { LuArrowLeft, LuCreditCard, LuLock } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { z } from "zod";
import { type FormErrors } from "@/types";
import { validateBillingPeriod, getPricePerModule, getNextRenewalDate } from "@/lib/pricing";
import { COUNTRIES } from "@/config/countries";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validation";

function CheckoutContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [errors, setErrors] = useState<FormErrors<CheckoutFormData>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const selectedPlans = useMemo(() => {
		const plans = searchParams.get('plans');
		return plans ? plans.split(',') : [];
	}, [searchParams]);

	const billing = validateBillingPeriod(searchParams.get('billing'));
	const autoScale = searchParams.get('autoScale') === 'true';

	const planDetails = useMemo(() => {
		const pricePerModule = getPricePerModule(billing);
		const totalModules = selectedPlans.length;
		const monthlyTotal = totalModules * pricePerModule;
		const annualTotal = monthlyTotal * 12;

		return {
			modules: selectedPlans.map(plan => plan.toUpperCase()).join(', ') || 'None',
			moduleCount: totalModules,
			billingCycle: billing === 'annual' ? 'Annual' : 'Monthly',
			monthlyAmount: `$${monthlyTotal.toLocaleString()}`,
			totalToday: billing === 'annual' ? `$${annualTotal.toLocaleString()}` : `$${monthlyTotal.toLocaleString()}`,
			nextRenewal: getNextRenewalDate(billing),
		};
	}, [selectedPlans, billing]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		const formData = new FormData(e.currentTarget);
		const formValues = Object.fromEntries(formData.entries());

		try {
			checkoutSchema.parse(formValues);

			await new Promise((resolve) => setTimeout(resolve, 2000));

			router.push("/connect-products");
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors<CheckoutFormData> = {};
				const zodError = error as z.ZodError<CheckoutFormData>;

				zodError.issues.forEach((fieldError) => {
					if (fieldError.path[0]) {
						const fieldName = fieldError.path[0] as keyof CheckoutFormData;
						newErrors[fieldName] = fieldError.message;
					}
				});
				setErrors(newErrors);

				if (zodError.issues.length > 0) {
					toast.error("Please fix the errors in the form");
				}
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBack = () => {
		router.back();
	};

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center relative z-10 w-full px-4 pb-16 max-w-7xl mx-auto">
				<PageHeader
					label="Checkout"
					title="Secure checkout."
					description="Complete your payment to activate your workspace."
				/>

				<div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
					<div className="lg:col-span-7 w-full flex flex-col">
						<form className="flex flex-col gap-8" onSubmit={handleSubmit}>
							<FormSection title="Payment details" delay={0.2}>
								  <Input
									id="cardNumber"
									name="cardNumber"
									type="text"
									placeholder="Card number"
									aria-label="Card number"
									autoComplete="cc-number"
									error={errors.cardNumber}
									inputSize="md"
									icon={<LuCreditCard className="w-5 h-5" />}
								/>
								<div className="grid grid-cols-2 gap-4">
									<Input
										id="expiry"
										name="expiry"
										type="text"
										placeholder="MM/YY"
										aria-label="Expiry date"
										autoComplete="cc-exp"
										error={errors.expiry}
										inputSize="md"
									/>
									<Input
										id="cvc"
										name="cvc"
										type="text"
										placeholder="CVC"
										aria-label="CVC"
										autoComplete="cc-csc"
										error={errors.cvc}
										inputSize="md"
									/>
								</div>
							</FormSection>

							<FormSection title="Billing details" delay={0.3}>
								<Input
									id="billingEmail"
									name="billingEmail"
									type="email"
									placeholder="Billing email"
									aria-label="Billing email"
									autoComplete="email"
									error={errors.billingEmail}
									inputSize="md"
								/>
								<Select
									id="country"
									name="country"
									placeholder="Country"
									aria-label="Country"
									selectSize="md"
									defaultValue=""
									error={errors.country}
									options={COUNTRIES}
								/>
								<Input
									id="companyName"
									name="companyName"
									type="text"
									placeholder="Company name (optional)"
									aria-label="Company name (optional)"
									autoComplete="organization"
									inputSize="md"
								/>
								<div>
									<Input
										id="taxId"
										name="taxId"
										type="text"
										placeholder="VAT/Tax ID (optional)"
										aria-label="VAT/Tax ID (optional)"
										inputSize="md"
									/>
									<p className="text-[11px] text-gray-600 mt-2 pl-4">Used for invoices where applicable.</p>
								</div>
							</FormSection>

							<motion.div
								className="flex flex-col gap-4"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<Button
									variant="solid"
									type="submit"
									className="w-full bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={isSubmitting}
									showArrow={false}
								>
									{isSubmitting ? "Processing..." : "Pay now"}
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={handleBack}
									showArrow={false}
									className="w-full border-white/10 hover:bg-white/5 hover:border-white/20"
								>
									<div className="flex items-center justify-center gap-2">
										<LuArrowLeft className="w-4 h-4" />
										Back
									</div>
								</Button>
							</motion.div>

							<motion.div
								className="flex flex-col items-center gap-2 mt-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.5 }}
							>
								<div className="flex items-center justify-center gap-1.5">
									<LuLock className="text-gray-500 w-3.5 h-3.5" />
									<span className="text-[11px] text-gray-500 font-medium">
										Payments are encrypted and securely processed.
									</span>
								</div>
								<span className="text-[11px] text-gray-600">Invoices available after payment.</span>
							</motion.div>
						</form>
					</div>

					<div className="lg:col-span-5 w-full pt-2">
						<OrderSummaryCard
							title="Order summary"
							items={[
								{ label: "Modules", value: planDetails.modules },
								{ label: "Billing cycle", value: planDetails.billingCycle },
								{ label: "Auto-scale", value: autoScale ? "Enabled" : "Disabled" },
							]}
							subtotal={{ label: "Monthly total", amount: planDetails.monthlyAmount }}
							tax={{ label: "Tax", amount: "Calculated at checkout", isCalculating: true }}
							total={{ label: "Total today", amount: planDetails.totalToday }}
							footer={`Next renewal: ${planDetails.nextRenewal}`}
							onChangePlan={handleBack}
							delay={0.3}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}

export default function CheckoutPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<CheckoutContent />
		</Suspense>
	);
}
