import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_PRODUCTS, STRIPE_PRICES } from '@/config/stripe';
import { PLAN_TYPES, BILLING_PERIODS, type PlanType, type BillingPeriod } from '@/config/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-06-30.basil' as Stripe.LatestApiVersion,
});

interface CheckoutRequest {
	plans: PlanType[];
	billing: BillingPeriod;
	autoScale?: boolean;
}

export async function POST(request: Request) {
	try {
		const body: CheckoutRequest = await request.json();
		const { plans, billing, autoScale } = body;

		if (!Array.isArray(plans) || plans.length === 0) {
			return NextResponse.json(
				{ error: 'No plans provided' },
				{ status: 400 }
			);
		}

		if (plans.length > 3) {
			return NextResponse.json(
				{ error: 'Maximum 3 modules allowed' },
				{ status: 400 }
			);
		}

		const invalidPlans = plans.filter(p => !PLAN_TYPES.includes(p));
		if (invalidPlans.length > 0) {
			return NextResponse.json(
				{ error: `Invalid plan types: ${invalidPlans.join(', ')}` },
				{ status: 400 }
			);
		}

		if (!BILLING_PERIODS.includes(billing)) {
			return NextResponse.json(
				{ error: 'Invalid billing period' },
				{ status: 400 }
			);
		}

		const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = plans.map((plan) => ({
			price_data: {
				currency: 'usd',
				product: STRIPE_PRODUCTS[plan],
				unit_amount: STRIPE_PRICES[plan][billing],
				recurring: {
					interval: billing === 'annual' ? 'year' : 'month',
				},
			},
			quantity: 1,
		}));

		const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'subscription',
			success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}/choose-plan`,
			metadata: {
				plans: plans.join(','),
				billing,
				autoScale: autoScale ? 'true' : 'false',
			},
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error('Stripe checkout error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
}
