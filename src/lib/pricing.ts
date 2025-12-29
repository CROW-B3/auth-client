import type { BillingPeriod } from "@/config/plans";

export const PRICING = {
	pricePerModuleMonthly: 60,
	pricePerModuleAnnual: 50,
} as const;

export const getPricePerModule = (billing: BillingPeriod): number => {
	return billing === "annual" ? PRICING.pricePerModuleAnnual : PRICING.pricePerModuleMonthly;
};

export const getNextRenewalDate = (billing: BillingPeriod): string => {
	const date = new Date();
	if (billing === "annual") {
		date.setFullYear(date.getFullYear() + 1);
	} else {
		date.setMonth(date.getMonth() + 1);
	}
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

export const validateBillingPeriod = (value: string | null): BillingPeriod => {
	return value === "monthly" ? "monthly" : "annual";
};
