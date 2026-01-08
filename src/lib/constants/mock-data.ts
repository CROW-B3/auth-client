export const MOCK_INVITATION = {
	organization: "Global Retail Ops",
	role: "Analyst",
	email: "name@company.com",
} as const;

export const MOCK_INVITATION_FIELDS = [
	{ label: 'Organization', value: MOCK_INVITATION.organization },
	{ label: 'Role', value: MOCK_INVITATION.role, variant: 'badge' as const },
	{ label: 'Email', value: MOCK_INVITATION.email },
] as const;

export const MOCK_SUCCESS_DETAILS = {
	organization: "Global Retail Ops",
	plan: "Monthly Web, Social",
	autoScaleToggle: "On",
} as const;

export const MOCK_SUCCESS_FIELDS = [
	{ label: 'Organization', value: MOCK_SUCCESS_DETAILS.organization },
	{ label: 'Plan', value: MOCK_SUCCESS_DETAILS.plan },
	{ label: 'Auto-scale toggle', value: MOCK_SUCCESS_DETAILS.autoScaleToggle },
] as const;
