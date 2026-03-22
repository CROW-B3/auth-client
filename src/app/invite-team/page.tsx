"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Button, Navbar, PageHeader, Select, EmailTagInput, PermissionToggle, PendingInviteCard } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuMessageCircle, LuNetwork, LuTrendingUp, LuUsers, LuKey } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { z } from "zod";
import { inviteTeamSchema, type PendingInvite } from "@/lib/validations";
import { useOnboardingStoreHydrated } from "@/stores/onboarding-store";
import { useSubmitTeam, useCompleteOnboarding, useSendTeamInvites, useOnboardingGuard } from "@/hooks/use-onboarding";
import { useCheckEmails } from "@/hooks/use-users";
import { buildPermissions, buildPermissionSummary } from "@/utils/permissions";
import { createPendingInvites, updateInviteSentTime, removeInvite } from "@/utils/invitations";
import { toggleComponent, filterExistingEmails, findAddedEmails } from "@/utils/components";

export default function InviteTeamPage() {
	const router = useRouter();
	const [emails, setEmails] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const [chatEnabled, setChatEnabled] = useState(false);
	const [chatComponents, setChatComponents] = useState<string[]>([]);
	const [lookbackWindow, setLookbackWindow] = useState("1year");
	const [interactionsEnabled, setInteractionsEnabled] = useState(false);
	const [patternsEnabled, setPatternsEnabled] = useState(false);
	const [teamManagementEnabled, setTeamManagementEnabled] = useState(false);
	const [apiKeyManagementEnabled, setApiKeyManagementEnabled] = useState(false);
	const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

	const { onboardingId, betterAuthOrgId, organizationName, hydrated } = useOnboardingStoreHydrated();
	const submitTeam = useSubmitTeam();
	const completeOnboarding = useCompleteOnboarding();
	const checkEmails = useCheckEmails();
	const sendInvites = useSendTeamInvites();

	useOnboardingGuard("team");

	const handleEmailsChange = async (newEmails: string[]) => {
		const addedEmails = findAddedEmails(newEmails, emails);

		if (addedEmails.length === 0 || !betterAuthOrgId) {
			setEmails(newEmails);
			return;
		}

		try {
			const result = await checkEmails.mutateAsync({
				emails: addedEmails,
				organizationId: betterAuthOrgId
			});

			if (result.existingEmails.length > 0) {
				const existingList = result.existingEmails.join(", ");
				toast.error(`These emails are already users: ${existingList}`);
				const filteredEmails = filterExistingEmails(newEmails, result.existingEmails);
				setEmails(filteredEmails);
				return;
			}
		} catch {
			toast.error("Failed to validate emails");
		}

		setEmails(newEmails);
	};

	const handleComponentToggle = (component: string) => {
		setChatComponents(toggleComponent(chatComponents, component));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (!hydrated) {
				toast.error("Please wait, loading your organization data...");
				setIsSubmitting(false);
				return;
			}

			if (!betterAuthOrgId || !organizationName) {
				toast.error("Organization information is missing. Please restart the onboarding process.");
				setIsSubmitting(false);
				return;
			}

			const permissions = buildPermissions(
				chatEnabled,
				chatComponents,
				lookbackWindow,
				interactionsEnabled,
				patternsEnabled,
				teamManagementEnabled,
				apiKeyManagementEnabled
			);

			const formData = {
				emails,
				permissions,
			};

			const validatedData = inviteTeamSchema.parse(formData);

			const session = await import("@/lib/auth-client").then((m) => m.getSession());
			const userData = session?.data?.user;

			if (!userData?.id) {
				toast.error("Session expired. Please sign in again.");
				setIsSubmitting(false);
				return;
			}

			const result = await sendInvites.mutateAsync({
				emails: validatedData.emails,
				organizationId: betterAuthOrgId,
				organizationName: organizationName || "Your Organization",
				inviterName: userData.name || "Team Admin",
				inviterId: userData.id,
				permissions: validatedData.permissions,
			});

			if (result.failed > 0) {
				const failedEmails = result.errors.map(e => e.email).join(", ");
				toast.error(`Failed to send ${result.failed} invite(s): ${failedEmails}`);
			}

			const newInvites = createPendingInvites(
				validatedData.emails,
				validatedData.permissions
			);

			setPendingInvites(prev => [...prev, ...newInvites]);

			toast.success(`Invitations sent to ${emails.length} ${emails.length === 1 ? "person" : "people"}!`);

			setEmails([]);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const firstError = error.issues[0];
				toast.error(firstError?.message || "Please fix validation errors");
			} else {
				const errorMessage = error instanceof Error ? error.message : "Failed to send invitations";
				toast.error(errorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSkip = async () => {
		await completeOnboardingProcess();
	};

	const handleFinish = async () => {
		await completeOnboardingProcess();
	};

	const completeOnboardingProcess = async () => {
		if (!onboardingId) {
			toast.error("Onboarding not initialized");
			return;
		}

		setIsCompleting(true);
		try {
			const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";
			const { createAuthHeaders } = await import("@/lib/auth-token");
			const authHeaders = await createAuthHeaders();

			await submitTeam.mutateAsync(onboardingId);

			const onboardingResponse = await fetch(
				`${API_GATEWAY_URL}/api/v1/auth/onboarding/${onboardingId}`,
				{ headers: authHeaders, credentials: "include" }
			);

			if (!onboardingResponse.ok) {
				toast.error("Failed to fetch onboarding data");
				return;
			}

			const { onboarding } = await onboardingResponse.json() as { onboarding: { orgBuilderId?: string; userBuilderId?: string } };

			if (onboarding.orgBuilderId && onboarding.orgBuilderId !== "null") {
				try {
					const finalizeOrgResponse = await fetch(
						`${API_GATEWAY_URL}/api/v1/organizations/org-builders/${onboarding.orgBuilderId}/finalize`,
						{
							method: "POST",
							headers: authHeaders,
							credentials: "include",
							body: JSON.stringify({}),
						}
					);
					if (!finalizeOrgResponse.ok) {
						console.error("Failed to finalize organization, proceeding anyway");
					}
				} catch {
					console.error("Error finalizing organization, proceeding anyway");
				}
			}

			if (onboarding.userBuilderId && onboarding.userBuilderId !== "null") {
				try {
					const session = await import("@/lib/auth-client").then((m) => m.getSession());
					const userData = session?.data?.user;

					if (userData) {
						const finalizeUserResponse = await fetch(
							`${API_GATEWAY_URL}/api/v1/users/user-builders/${onboarding.userBuilderId}/finalize`,
							{
								method: "POST",
								headers: authHeaders,
								credentials: "include",
								body: JSON.stringify({
									email: userData.email,
									name: userData.name,
									onboardingId: onboardingId,
								}),
							}
						);
						if (!finalizeUserResponse.ok) {
							console.error("Failed to finalize user, proceeding anyway");
						}
					}
				} catch {
					console.error("Error finalizing user, proceeding anyway");
				}
			}

			await completeOnboarding.mutateAsync(onboardingId);

			router.push("/onboarding-complete");
		} catch {
			toast.error("Failed to complete onboarding. Please try again.");
		} finally {
			setIsCompleting(false);
		}
	};

	const handleResend = async (id: string) => {
		const invite = pendingInvites.find((inv) => inv.id === id);
		if (!invite || !betterAuthOrgId || !organizationName) {
			toast.error("Cannot resend invitation");
			return;
		}

		try {
			const session = await import("@/lib/auth-client").then((m) => m.getSession());
			const userData = session?.data?.user;

			if (!userData?.id) {
				toast.error("Session expired. Please sign in again.");
				return;
			}

			const result = await sendInvites.mutateAsync({
				emails: [invite.email],
				organizationId: betterAuthOrgId,
				organizationName: organizationName,
				inviterName: userData.name || "Team Admin",
				inviterId: userData.id,
				permissions: invite.permissions || {},
			});

			if (result.success && result.sent > 0) {
				toast.success(`Invitation resent to ${invite.email}!`);
				setPendingInvites(prev => updateInviteSentTime(prev, id));
			} else {
				toast.error("Failed to resend invitation");
			}
		} catch {
			toast.error("Failed to resend invitation");
		}
	};

	const handleRevoke = async (id: string) => {
		const invite = pendingInvites.find((inv) => inv.id === id);

		if (!invite) {
			return;
		}

		try {
			const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";
			const { createAuthHeaders } = await import("@/lib/auth-token");
			const headers = await createAuthHeaders();
			const res = await fetch(
				`${API_GATEWAY_URL}/api/v1/auth/team-invitations/invitations/${encodeURIComponent(id)}`,
				{ method: "DELETE", headers, credentials: "include" }
			);
			if (!res.ok) {
				toast.error(`Failed to revoke invitation for ${invite.email}`);
				return;
			}
		} catch {
			toast.error(`Failed to revoke invitation for ${invite.email}`);
			return;
		}

		setPendingInvites(prev => removeInvite(prev, id));
		toast.success(`Invitation to ${invite.email} revoked`);
	};

	const permissionTags = buildPermissionSummary(
		chatEnabled,
		chatComponents,
		lookbackWindow,
		interactionsEnabled,
		patternsEnabled,
		teamManagementEnabled,
		apiKeyManagementEnabled
	);

	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
			/>

			<main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-6 pb-6 max-w-7xl mx-auto">
				<div className="w-full flex flex-col justify-center py-1">
					<PageHeader
						label="SETUP"
						title="Invite your team."
						description="Add teammates and control what they can access."
					/>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
						<motion.div
							className="flex flex-col w-full max-w-[520px] mx-auto lg:mx-0 justify-self-end"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
						>
							<form id="invite-form" onSubmit={handleSubmit} noValidate className="flex flex-col">
								<div className="max-h-[500px] overflow-y-auto pr-2 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
								>
									<EmailTagInput emails={emails} onEmailsChange={handleEmailsChange} />
								</motion.div>

								<motion.div
									className="space-y-4"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
								>
									<div className="border-b border-white/5 pb-2 mb-2">
										<h3 className="text-xs font-medium text-white uppercase tracking-wider ml-1">
											Access
										</h3>
										<p className="text-[10px] text-gray-500 ml-1 mt-0.5">
											Toggle what this invite can access.
										</p>
									</div>

									<div className="space-y-3">
										<PermissionToggle
											icon={<LuMessageCircle className="text-[18px]" />}
											title="Chat"
											description="Ask questions over allowed sources."
											enabled={chatEnabled}
											onToggle={setChatEnabled}
											expandable={true}
											expanded={chatEnabled}
											highlighted={chatEnabled}
										>
											<div className="mt-3 space-y-3 pl-11">
												<div>
													<label className="text-[10px] font-medium text-gray-400 mb-1.5 block">
														Allowed components <span className="text-violet-400">*</span>
													</label>
													<div className="flex gap-2">
														{["web", "cctv", "social"].map((component) => (
															<button
																key={component}
																type="button"
																onClick={() => handleComponentToggle(component)}
																className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
																	chatComponents.includes(component)
																		? "bg-violet-500 text-white shadow-md"
																		: "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
																}`}
															>
																{component.charAt(0).toUpperCase() + component.slice(1)}
															</button>
														))}
													</div>
													<p className="text-[9px] text-gray-600 mt-1">
														Select at least 1 component.
													</p>
												</div>
												<div>
													<label className="text-[10px] font-medium text-gray-400 mb-1.5 block">
														Max lookback window
													</label>
													<Select
														selectSize="sm"
														defaultValue={lookbackWindow}
														onChange={(value) => setLookbackWindow(value)}
														options={[
															{ value: "7days", label: "7 days" },
															{ value: "30days", label: "30 days" },
															{ value: "90days", label: "90 days" },
															{ value: "1year", label: "1 year" },
															{ value: "all", label: "All retention" },
														]}
													/>
												</div>
											</div>
										</PermissionToggle>

										<PermissionToggle
											icon={<LuNetwork className="text-[18px]" />}
											title="Interactions"
											description="View evidence feed and export."
											enabled={interactionsEnabled}
											onToggle={setInteractionsEnabled}
										/>

										<PermissionToggle
											icon={<LuTrendingUp className="text-[18px]" />}
											title="Patterns"
											description="View derived patterns and anomalies."
											enabled={patternsEnabled}
											onToggle={setPatternsEnabled}
										/>

										<PermissionToggle
											icon={<LuUsers className="text-[18px]" />}
											title="Team management"
											description="Invite/revoke members and manage access."
											enabled={teamManagementEnabled}
											onToggle={setTeamManagementEnabled}
										/>

										<PermissionToggle
											icon={<LuKey className="text-[18px]" />}
											title="API key management"
											description="Create and manage API keys with all scopes."
											enabled={apiKeyManagementEnabled}
											onToggle={setApiKeyManagementEnabled}
										/>
									</div>
								</motion.div>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
									className="mt-4"
								>
									<label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 block">
										Summary
									</label>
									<div className="flex flex-wrap gap-1.5">
										{permissionTags.map((tag, index) => (
											<span
												key={index}
												className={`${
													tag.startsWith("Chat:") || tag.startsWith("API key")
														? "bg-violet-500/10 border-violet-500/20 text-violet-200"
														: "bg-white/5 border-white/10 text-gray-300"
												} border text-[10px] px-2 py-0.5 rounded font-medium`}
											>
												{tag}
											</span>
										))}
									</div>
								</motion.div>

							</form>
						</motion.div>

						<motion.div
							className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col max-h-[600px] shadow-card-glow w-full max-w-[480px] justify-self-start overflow-hidden relative"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
						>
							<div className="absolute top-0 right-0 w-full h-8 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-10"></div>

							<div className="flex items-center justify-between mb-5 shrink-0">
								<h3 className="text-xs font-semibold tracking-tight uppercase text-violet-200/70">
									Pending invitations
								</h3>
							</div>

							<div className="flex flex-col h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
								<div className="flex flex-col divide-y divide-white/5">
									{pendingInvites.map((invite) => (
										<PendingInviteCard
											key={invite.id}
											invite={invite}
											onResend={handleResend}
											onRevoke={handleRevoke}
										/>
									))}
								</div>
							</div>

							<div className="absolute bottom-0 right-0 w-full h-8 bg-gradient-to-t from-white/[0.03] to-transparent pointer-events-none z-10"></div>
						</motion.div>
					</div>

					<motion.div
						className="w-full max-w-2xl mx-auto mt-8"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<Button
									variant="solid"
									type="button"
									onClick={() => {
										const form = document.getElementById('invite-form') as HTMLFormElement | null;
										form?.requestSubmit();
									}}
									className="flex-1 bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
									showArrow={true}
									arrowIcon={isSubmitting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
									disabled={isSubmitting || isCompleting}
								>
									{isSubmitting ? "Sending" : "Send invites"}
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={handleSkip}
									showArrow={false}
									disabled={isSubmitting || isCompleting}
									className="flex-1 border-white/10 hover:border-white/20"
								>
									{isCompleting ? "Completing..." : "Skip for now"}
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={handleFinish}
									showArrow={true}
									arrowIcon={isCompleting ? <LuLoader className="animate-spin" /> : <LuArrowRight />}
									disabled={isSubmitting || isCompleting}
									className="flex-1 border-white/10 hover:border-white/20"
								>
									{isCompleting ? "Completing..." : "Finish setup"}
								</Button>
							</div>
							<p className="text-[11px] text-gray-500 text-center">
								Invites are sent by email. Access activates after acceptance.
							</p>
						</div>
					</motion.div>
				</div>
			</main>
		</div>
	);
}
