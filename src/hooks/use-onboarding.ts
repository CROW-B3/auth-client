import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnboardingStore } from "@/stores/onboarding-store";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

interface OnboardingRecord {
	id: string;
	betterAuthUserId: string;
	betterAuthOrgId?: string;
	orgBuilderId?: string;
	userBuilderId?: string;
	billingBuilderId?: string;
	currentStep: number;
	completedSteps: string[];
	status: "in_progress" | "completed" | "abandoned";
}

interface StartOnboardingResponse {
	redirect?: string;
	onboarding?: OnboardingRecord;
}

interface OrganizationStepInput {
	organizationName: string;
	slug: string;
	betterAuthOrgId: string;
	betterAuthUserId: string;
}

interface PlanStepInput {
	modules: { web: boolean; cctv: boolean; social: boolean };
	payAsYouGo: boolean;
	billingPeriod: "monthly" | "annual";
}

interface ProductsStepInput {
	sourceType: "csv" | "json" | "url";
	sourceValue: string;
}

interface SourceStepInput {
	sourceType: "web" | "cctv" | "social";
	apiKeyId: string;
}

interface CheckoutSessionInput {
	billingBuilderId: string;
	successUrl: string;
	cancelUrl: string;
}

interface CheckoutSessionResponse {
	url: string;
	sessionId: string;
}

const onboardingApi = {
	start: async (betterAuthUserId: string): Promise<StartOnboardingResponse> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/start`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ betterAuthUserId }),
		});
		if (!response.ok) throw new Error("Failed to start onboarding");
		return response.json();
	},

	getByUserId: async (userId: string): Promise<OnboardingRecord | null> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/user/${userId}`, {
			credentials: "include",
		});
		if (response.status === 404) return null;
		if (!response.ok) throw new Error("Failed to get onboarding");
		const data = await response.json();
		return data.onboarding;
	},

	getById: async (onboardingId: string): Promise<OnboardingRecord | null> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}`, {
			credentials: "include",
		});
		if (response.status === 404) return null;
		if (!response.ok) throw new Error("Failed to get onboarding");
		const data = await response.json();
		return data.onboarding;
	},

	submitOrganization: async (onboardingId: string, input: OrganizationStepInput): Promise<OnboardingRecord> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/organization`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit organization step");
		const data = await response.json();
		return data.onboarding;
	},

	submitPlan: async (onboardingId: string, input: PlanStepInput): Promise<OnboardingRecord> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/plan`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit plan step");
		const data = await response.json();
		return data.onboarding;
	},

	submitProducts: async (onboardingId: string, input: ProductsStepInput): Promise<OnboardingRecord> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/products`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit products step");
		const data = await response.json();
		return data.onboarding;
	},

	submitSource: async (onboardingId: string, input: SourceStepInput): Promise<OnboardingRecord> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/sources`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit source step");
		const data = await response.json();
		return data.onboarding;
	},

	submitTeam: async (onboardingId: string): Promise<OnboardingRecord> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/team`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});
		if (!response.ok) throw new Error("Failed to submit team step");
		const data = await response.json();
		return data.onboarding;
	},

	complete: async (onboardingId: string): Promise<OnboardingRecord> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/complete`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});
		if (!response.ok) throw new Error("Failed to complete onboarding");
		const data = await response.json();
		return data.onboarding;
	},

	createCheckoutSession: async (input: CheckoutSessionInput): Promise<CheckoutSessionResponse> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/billing/checkout/session`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to create checkout session");
		return response.json();
	},
};

export const useStartOnboarding = () => {
	const { setOnboardingId } = useOnboardingStore();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: onboardingApi.start,
		onSuccess: (data) => {
			if (data.onboarding) {
				setOnboardingId(data.onboarding.id);
				queryClient.setQueryData(["onboarding", data.onboarding.id], data.onboarding);
			}
		},
	});
};

export const useOnboardingByUserId = (userId: string | undefined) => {
	const { setOnboardingId } = useOnboardingStore();

	return useQuery({
		queryKey: ["onboarding", "user", userId],
		queryFn: () => onboardingApi.getByUserId(userId!),
		enabled: !!userId,
		select: (data) => {
			if (data) setOnboardingId(data.id);
			return data;
		},
	});
};

export const useSubmitOrganization = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ onboardingId, input }: { onboardingId: string; input: OrganizationStepInput }) =>
			onboardingApi.submitOrganization(onboardingId, input),
		onSuccess: (data) => {
			queryClient.setQueryData(["onboarding", data.id], data);
		},
	});
};

export const useSubmitPlan = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ onboardingId, input }: { onboardingId: string; input: PlanStepInput }) =>
			onboardingApi.submitPlan(onboardingId, input),
		onSuccess: (data) => {
			queryClient.setQueryData(["onboarding", data.id], data);
		},
	});
};

export const useSubmitProducts = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ onboardingId, input }: { onboardingId: string; input: ProductsStepInput }) =>
			onboardingApi.submitProducts(onboardingId, input),
		onSuccess: (data) => {
			queryClient.setQueryData(["onboarding", data.id], data);
		},
	});
};

export const useSubmitSource = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ onboardingId, input }: { onboardingId: string; input: SourceStepInput }) =>
			onboardingApi.submitSource(onboardingId, input),
		onSuccess: (data) => {
			queryClient.setQueryData(["onboarding", data.id], data);
		},
	});
};

export const useSubmitTeam = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (onboardingId: string) => onboardingApi.submitTeam(onboardingId),
		onSuccess: (data) => {
			queryClient.setQueryData(["onboarding", data.id], data);
		},
	});
};

export const useCompleteOnboarding = () => {
	const queryClient = useQueryClient();
	const { reset } = useOnboardingStore();

	return useMutation({
		mutationFn: (onboardingId: string) => onboardingApi.complete(onboardingId),
		onSuccess: (data) => {
			queryClient.setQueryData(["onboarding", data.id], data);
			reset();
		},
	});
};

export const useOnboardingById = (onboardingId: string | null) => {
	return useQuery({
		queryKey: ["onboarding", onboardingId],
		queryFn: () => onboardingApi.getById(onboardingId!),
		enabled: !!onboardingId,
	});
};

export const useCreateCheckoutSession = () => {
	const { setStripeSessionId } = useOnboardingStore();

	return useMutation({
		mutationFn: onboardingApi.createCheckoutSession,
		onSuccess: (data) => {
			setStripeSessionId(data.sessionId);
		},
	});
};
