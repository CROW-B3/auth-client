import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanType, BillingPeriod } from "@/config/plans";

type ConnectionStatus = "not_started" | "in_progress" | "connected";

interface OnboardingState {
	onboardingId: string | null;
	betterAuthOrgId: string | null;
	organizationName: string;
	organizationSlug: string;
	selectedPlans: PlanType[];
	billingPeriod: BillingPeriod;
	autoScale: boolean;
	stripeSessionId: string | null;
	connectionStatus: Record<string, ConnectionStatus>;
	invitedEmails: string[];
}

interface OnboardingActions {
	setOnboardingId: (id: string | null) => void;
	setBetterAuthOrgId: (id: string | null) => void;
	setOrganizationName: (name: string) => void;
	setOrganizationSlug: (slug: string) => void;
	setSelectedPlans: (plans: PlanType[]) => void;
	togglePlan: (plan: PlanType) => void;
	setBillingPeriod: (period: BillingPeriod) => void;
	setAutoScale: (enabled: boolean) => void;
	setStripeSessionId: (sessionId: string | null) => void;
	setConnectionStatus: (sourceId: string, status: ConnectionStatus) => void;
	addInvitedEmail: (email: string) => void;
	removeInvitedEmail: (email: string) => void;
	reset: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

const initialState: OnboardingState = {
	onboardingId: null,
	betterAuthOrgId: null,
	organizationName: "",
	organizationSlug: "",
	selectedPlans: [],
	billingPeriod: "annual",
	autoScale: false,
	stripeSessionId: null,
	connectionStatus: {
		web: "not_started",
		cctv: "not_started",
		social: "not_started",
	},
	invitedEmails: [],
};

export const useOnboardingStore = create<OnboardingStore>()(
	persist(
		(set, get) => ({
			...initialState,

			setOnboardingId: (onboardingId) => set({ onboardingId }),
			setBetterAuthOrgId: (betterAuthOrgId) => set({ betterAuthOrgId }),
			setOrganizationName: (organizationName) => set({ organizationName }),
			setOrganizationSlug: (slug) => set({ organizationSlug: slug }),
			setSelectedPlans: (selectedPlans) => set({ selectedPlans }),

			togglePlan: (plan) => {
				const { selectedPlans } = get();
				if (selectedPlans.includes(plan)) {
					set({ selectedPlans: selectedPlans.filter((p) => p !== plan) });
				} else if (selectedPlans.length < 3) {
					set({ selectedPlans: [...selectedPlans, plan] });
				}
			},

			setBillingPeriod: (billingPeriod) => set({ billingPeriod }),
			setAutoScale: (autoScale) => set({ autoScale }),
			setStripeSessionId: (stripeSessionId) => set({ stripeSessionId }),

			setConnectionStatus: (sourceId, status) =>
				set((state) => ({
					connectionStatus: { ...state.connectionStatus, [sourceId]: status },
				})),

			addInvitedEmail: (email) =>
				set((state) => ({ invitedEmails: [...state.invitedEmails, email] })),

			removeInvitedEmail: (email) =>
				set((state) => ({
					invitedEmails: state.invitedEmails.filter((e) => e !== email),
				})),

			reset: () => set(initialState),
		}),
		{ name: "crow-onboarding" }
	)
);
