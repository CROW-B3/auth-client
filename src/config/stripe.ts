import type { PlanType, BillingPeriod } from './plans';

export const STRIPE_PRODUCTS: Record<PlanType, string> = {
	web: 'prod_TmlHqy6weaSHld',
	cctv: 'prod_TmlHuZu1nKScnp',
	social: 'prod_TmlIgYs5cwwdF5',
};

export const STRIPE_PRICES: Record<PlanType, Record<BillingPeriod, number>> = {
	web: { monthly: 6000, annual: 5000 },
	cctv: { monthly: 6000, annual: 5000 },
	social: { monthly: 6000, annual: 5000 },
};

export const getStripeProductId = (planType: PlanType): string => {
	return STRIPE_PRODUCTS[planType];
};

export const getStripePriceAmount = (planType: PlanType, billing: BillingPeriod): number => {
	return STRIPE_PRICES[planType][billing];
};
