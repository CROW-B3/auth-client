import { useMutation } from "@tanstack/react-query";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

interface CheckEmailsResponse {
	existingEmails: string[];
}

const userApi = {
	checkEmails: async (emails: string[], organizationId: string): Promise<CheckEmailsResponse> => {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/users/check-emails`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ emails, organizationId }),
		});
		if (!response.ok) throw new Error("Failed to check emails");
		return response.json();
	},
};

export const useCheckEmails = () => {
	return useMutation({
		mutationFn: ({ emails, organizationId }: { emails: string[]; organizationId: string }) =>
			userApi.checkEmails(emails, organizationId),
	});
};
