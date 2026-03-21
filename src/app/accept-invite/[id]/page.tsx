"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Navbar } from "@b3-crow/ui-kit";
import { LuLoader } from "react-icons/lu";
import toast from "react-hot-toast";
import { organization, getSession } from "@/lib/auth-client";

export default function AcceptInviteByIdPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const [status, setStatus] = useState<"accepting" | "error">("accepting");

	useEffect(() => {
		const acceptInvite = async () => {
			try {
				const session = await getSession();

				if (!session?.data?.user?.id) {
					router.push(`/login?redirect=/accept-invite/${id}`);
					return;
				}

				const result = await organization.acceptInvitation({ invitationId: id });

				if (result.error) {
					toast.error(result.error.message || "Failed to accept invitation");
					setStatus("error");
					return;
				}

				toast.success("Invitation accepted! Welcome to the team.");

				const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
				window.location.href = dashboardUrl;
			} catch {
				toast.error("Failed to accept invitation. The link may have expired.");
				setStatus("error");
			}
		};

		void acceptInvite();
	}, [id, router]);

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden relative">
			<AnimatedBackground />
			<Navbar logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }} />
			<main className="flex-grow flex flex-col items-center justify-center relative z-10">
				{status === "accepting" ? (
					<div className="flex flex-col items-center gap-4">
						<LuLoader className="w-8 h-8 animate-spin text-violet-500" />
						<p className="text-zinc-400 text-sm">Accepting invitation...</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-4 text-center px-4">
						<p className="text-white text-lg font-medium">Invitation could not be accepted</p>
						<p className="text-zinc-400 text-sm max-w-sm">
							The invitation link may have expired or already been used.
						</p>
						<button
							onClick={() => router.push("/")}
							className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
							type="button"
						>
							Go to home
						</button>
					</div>
				)}
			</main>
		</div>
	);
}
