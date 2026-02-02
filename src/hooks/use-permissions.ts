import { useQuery } from "@tanstack/react-query";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

interface Permissions {
	chat?: {
		enabled: boolean;
		components: Array<"web" | "cctv" | "social">;
		lookbackWindow: "7days" | "30days" | "90days" | "1year" | "all";
	};
	interactions: boolean;
	patterns: boolean;
	teamManagement: boolean;
	apiKeyManagement: boolean;
}

interface User {
	id: string;
	betterAuthUserId: string;
	organizationId?: string;
	name: string;
	email: string;
	profilePictureUrl?: string;
	role: "admin" | "member";
	permissions: Permissions;
}

export const usePermissions = (userId?: string) => {
	return useQuery({
		queryKey: ["permissions", userId],
		queryFn: async (): Promise<Permissions> => {
			if (!userId) {
				throw new Error("User ID required");
			}

			const response = await fetch(`${API_GATEWAY_URL}/api/v1/users/${userId}/permissions`, {
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch permissions");
			}

			return response.json();
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

export const useUser = (userId?: string) => {
	return useQuery({
		queryKey: ["user", userId],
		queryFn: async (): Promise<User> => {
			if (!userId) {
				throw new Error("User ID required");
			}

			const response = await fetch(`${API_GATEWAY_URL}/api/v1/users/${userId}`, {
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch user");
			}

			return response.json();
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

export const hasPermission = (permissions: Permissions | undefined, permission: keyof Permissions): boolean => {
	if (!permissions) return false;
	const value = permissions[permission];
	return typeof value === "boolean" ? value : !!value;
};

export const canAccessChat = (permissions: Permissions | undefined): boolean => {
	return !!permissions?.chat?.enabled;
};

export const canManageTeam = (permissions: Permissions | undefined): boolean => {
	return !!permissions?.teamManagement;
};

export const canManageAPIKeys = (permissions: Permissions | undefined): boolean => {
	return !!permissions?.apiKeyManagement;
};

export const isAdmin = (user: User | undefined): boolean => {
	return user?.role === "admin";
};
