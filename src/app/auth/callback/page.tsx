"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@b3-crow/ui-kit";
import { LuLoader } from "react-icons/lu";
import toast from "react-hot-toast";
import { getSession } from "@/lib/auth-client";
import { useDetermineAuthFlow } from "@/hooks/use-onboarding";

const processPendingInvitation = async (
	pendingInvitationStr: string,
	betterAuthUserId: string,
	setStatus: (status: string) => void
): Promise<boolean> => {
	const pendingInvitation = JSON.parse(pendingInvitationStr);
	const { organizationId, email } = pendingInvitation;

	if (!organizationId || !email) return false;

	setStatus("Accepting your invitation...");

	const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

	const response = await fetch(
		`${API_GATEWAY_URL}/api/v1/organizations/${organizationId}/members`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				email,
				role: "member",
				betterAuthUserId,
			}),
		}
	);

	if (!response.ok) {
		throw new Error("Failed to accept invitation");
	}

	sessionStorage.removeItem("pendingInvitation");

	setStatus("Welcome to the team! Redirecting to dashboard...");
	const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
	window.location.href = dashboardUrl;

	return true;
};

export default function AuthCallbackPage() {
	const router = useRouter();
	const [status, setStatus] = useState("Verifying your account...");
	const determineAuthFlow = useDetermineAuthFlow();
	const hasRun = useRef(false);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;

		const handleCallback = async () => {
			try {
				const session = await getSession();

				if (!session?.data?.user?.id) {
					toast.error("Authentication failed. Please try again.");
					router.push("/login");
					return;
				}

				const pendingInvitationStr = sessionStorage.getItem("pendingInvitation");
				if (pendingInvitationStr) {
					try {
						const hasPendingInvitation = await processPendingInvitation(
							pendingInvitationStr,
							session.data.user.id,
							setStatus
						);
						if (hasPendingInvitation) return;
					} catch {
						sessionStorage.removeItem("pendingInvitation");
						toast.error("Failed to accept invitation. Continuing with onboarding...");
					}
				}

				setStatus("Checking account status...");

				const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

				const userResponse = await fetch(
					`${API_GATEWAY_URL}/api/v1/users/by-auth-id/${session.data.user.id}`,
					{ credentials: "include" }
				);

				if (!userResponse.ok) {
					const isOAuth = session.data.user.image;

					if (isOAuth && session.data.user.image) {
						setStatus("Setting up your profile...");

						try {
							await fetch(session.data.user.image, {
								mode: 'no-cors',
								cache: 'no-cache'
							});
						} catch {
						}

						setStatus("Continuing your setup...");
						router.push("/organization");
						return;
					}

					setStatus("Please complete your profile...");
					router.push("/complete-profile");
					return;
				}

				const result = await determineAuthFlow.mutateAsync(session.data.user.id);

				if (result.destination === "dashboard") {
					setStatus("Welcome back! Redirecting to dashboard...");
					const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
					window.location.href = dashboardUrl;
					return;
				}

				setStatus("Continuing your setup...");
				router.push(result.targetRoute || "/organization");
			} catch {
				toast.error("Something went wrong. Please try again.");
				router.push("/login");
			}
		};

		handleCallback();
	}, [router, determineAuthFlow]);

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<main className="flex-grow flex items-center justify-center relative z-10 w-full px-4 py-8">
				<div className="w-full max-w-[380px] flex flex-col items-center text-center space-y-6">
					<div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center">
						<LuLoader className="w-8 h-8 text-violet-500 animate-spin" />
					</div>
					<div className="space-y-2">
						<h1 className="text-xl font-semibold text-white">{status}</h1>
						<p className="text-gray-500 text-sm">Please wait while we set things up for you.</p>
					</div>
				</div>
			</main>
		</div>
	);
}
