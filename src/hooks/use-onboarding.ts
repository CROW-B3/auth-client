import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { createAuthHeaders } from "@/lib/auth-token";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

interface UserRecord {
	id: string;
	betterAuthUserId: string;
	organizationId: string;
	email: string;
	name: string;
	permissions: Record<string, unknown>;
	role: "owner" | "admin" | "member";
}

interface AuthFlowResult {
	destination: "dashboard" | "onboarding";
	onboarding?: OnboardingRecord;
	user?: UserRecord;
	targetRoute?: string;
}

const ONBOARDING_STEPS = [
	{ step: 1, name: "organization", route: "/organization" },
	{ step: 2, name: "modules", route: "/choose-modules" },
	{ step: 3, name: "checkout", route: "/checkout" },
	{ step: 4, name: "products", route: "/connect-products" },
	{ step: 5, name: "sources", route: "/setup-components" },
	{ step: 6, name: "team", route: "/invite-team" },
] as const;

interface ProductSource {
	type: "csv" | "json" | "url";
	value: string;
	jobId?: string;
	status: "pending" | "processing" | "completed" | "failed";
}

interface SourceConnection {
	apiKeyId: string;
	connected: boolean;
}

interface OnboardingRecord {
	id: string;
	betterAuthUserId: string;
	betterAuthOrgId?: string;
	orgBuilderId?: string;
	userBuilderId?: string;
	billingBuilderId?: string;
	currentStep: number;
	completedSteps: string[];
	productSource?: ProductSource;
	sources?: {
		web?: SourceConnection;
		cctv?: SourceConnection;
		social?: SourceConnection;
	};
	status: "in_progress" | "completed" | "abandoned";
}

interface StartOnboardingResponse {
	redirect?: string;
	onboarding?: OnboardingRecord;
}

interface OnboardingApiResponse {
	onboarding: OnboardingRecord;
}

interface OrganizationStepInput {
	betterAuthOrgId: string;
	orgBuilderId: string;
	userBuilderId: string;
	billingBuilderId: string;
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

interface CheckoutStepInput {
	stripeSessionId: string;
}

interface CheckoutSessionInput {
	onboardingId: string;
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
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/start`, {
			method: "POST",
			headers,
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
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	getById: async (onboardingId: string): Promise<OnboardingRecord | null> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}`, {
			credentials: "include",
		});
		if (response.status === 404) return null;
		if (!response.ok) throw new Error("Failed to get onboarding");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	submitOrganization: async (onboardingId: string, input: OrganizationStepInput): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/organization`, {
			method: "PATCH",
			headers,
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit organization step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	submitPlan: async (onboardingId: string, input: PlanStepInput): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/plan`, {
			method: "PATCH",
			headers,
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit plan step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	submitCheckout: async (onboardingId: string, input: CheckoutStepInput): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/checkout`, {
			method: "PATCH",
			headers,
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit checkout step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	submitProducts: async (onboardingId: string, input: ProductsStepInput): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/products`, {
			method: "PATCH",
			headers,
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit products step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	submitSource: async (onboardingId: string, input: SourceStepInput): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/sources`, {
			method: "PATCH",
			headers,
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to submit source step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	skipSources: async (onboardingId: string): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/sources/skip`, {
			method: "PATCH",
			headers,
			credentials: "include",
		});
		if (!response.ok) throw new Error("Failed to skip sources step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	submitTeam: async (onboardingId: string): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/step/team`, {
			method: "PATCH",
			headers,
			credentials: "include",
		});
		if (!response.ok) throw new Error("Failed to submit team step");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	complete: async (onboardingId: string): Promise<OnboardingRecord> => {
		const headers = await createAuthHeaders();
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/complete`, {
			method: "POST",
			headers,
			credentials: "include",
		});
		if (!response.ok) throw new Error("Failed to complete onboarding");
		const data = (await response.json()) as OnboardingApiResponse;
		return data.onboarding;
	},

	createCheckoutSession: async (input: CheckoutSessionInput): Promise<CheckoutSessionResponse> => {
		const headers = await createAuthHeaders();
		const { onboardingId, ...body } = input;
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}/create-checkout`, {
			method: "POST",
			headers,
			credentials: "include",
			body: JSON.stringify(body),
		});
		if (!response.ok) throw new Error("Failed to create checkout session");
		return response.json();
	},

	sendTeamInvites: async (input: {
		emails: string[];
		organizationId: string;
		organizationName: string;
		inviterName: string;
		inviterId: string;
		permissions?: Record<string, unknown>;
	}): Promise<{ success: boolean; sent: number; failed: number; errors: Array<{ email: string; error: string }> }> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/team-invitations/send-invites`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Failed to send team invitations");
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

export const useSubmitCheckout = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ onboardingId, input }: { onboardingId: string; input: CheckoutStepInput }) =>
			onboardingApi.submitCheckout(onboardingId, input),
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

export const useSkipSources = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (onboardingId: string) => onboardingApi.skipSources(onboardingId),
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

export const useSendTeamInvites = () => {
	return useMutation({
		mutationFn: (input: {
			emails: string[];
			organizationId: string;
			organizationName: string;
			inviterName: string;
			inviterId: string;
			permissions?: Record<string, unknown>;
		}) => onboardingApi.sendTeamInvites(input),
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

const userApi = {
	getByAuthId: async (betterAuthUserId: string): Promise<UserRecord | null> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/users/by-auth-id/${betterAuthUserId}`, {
			credentials: "include",
		});
		if (response.status === 404 || response.status === 401) return null;
		if (!response.ok) throw new Error("Failed to get user");
		return response.json();
	},
};

export const useUserByAuthId = (betterAuthUserId: string | undefined) => {
	return useQuery({
		queryKey: ["user", "by-auth-id", betterAuthUserId],
		queryFn: () => userApi.getByAuthId(betterAuthUserId!),
		enabled: !!betterAuthUserId,
	});
};

const findFirstIncompleteOnboardingStep = (completedSteps: string[]): typeof ONBOARDING_STEPS[number] => {
	return ONBOARDING_STEPS.find((step) => !completedSteps.includes(step.name)) ?? ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
};

const determineTargetRouteForOnboarding = (onboarding: OnboardingRecord): string => {
	const completedSteps = onboarding.completedSteps || [];
	if (completedSteps.length === 0) return "/organization";

	return findFirstIncompleteOnboardingStep(completedSteps).route;
};

export const determineAuthFlowDestination = async (betterAuthUserId: string): Promise<AuthFlowResult> => {
	const user = await userApi.getByAuthId(betterAuthUserId);

	if (user?.organizationId) {
		return { destination: "dashboard", user };
	}

	const onboardingResult = await onboardingApi.start(betterAuthUserId);

	if (onboardingResult.redirect?.startsWith("/accept-invite/")) {
		return { destination: "onboarding", targetRoute: onboardingResult.redirect };
	}

	if (onboardingResult.redirect) {
		return { destination: "dashboard" };
	}

	if (!onboardingResult.onboarding) {
		return { destination: "onboarding", targetRoute: "/organization" };
	}

	const targetRoute = determineTargetRouteForOnboarding(onboardingResult.onboarding);

	return {
		destination: "onboarding",
		onboarding: onboardingResult.onboarding,
		targetRoute,
	};
};

export const useDetermineAuthFlow = () => {
	const { setOnboardingId, setBetterAuthOrgId } = useOnboardingStore();

	return useMutation({
		mutationFn: determineAuthFlowDestination,
		onSuccess: (data) => {
			if (data.onboarding) {
				setOnboardingId(data.onboarding.id);
				if (data.onboarding.betterAuthOrgId) {
					setBetterAuthOrgId(data.onboarding.betterAuthOrgId);
				}
			}
		},
	});
};

export const useOnboardingGuard = (requiredStep: typeof ONBOARDING_STEPS[number]['name']) => {
	const { onboardingId } = useOnboardingStore();

	return useQuery({
		queryKey: ["onboarding-guard", onboardingId, requiredStep],
		queryFn: async () => {
			if (!onboardingId) {
				return { isLoading: false };
			}

			const onboarding = await onboardingApi.getById(onboardingId);

			if (!onboarding) {
				return { isLoading: false };
			}

			return { isLoading: false, onboarding };
		},
		enabled: !!onboardingId || requiredStep === "organization",
		refetchOnWindowFocus: false,
	});
};
