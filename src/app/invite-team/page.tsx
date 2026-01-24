"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground, Button, Navbar, PageHeader, Select, EmailTagInput, PermissionToggle, PendingInviteCard  } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuMessageCircle, LuNetwork, LuTrendingUp, LuUsers, LuKey } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { z } from "zod";
import { inviteTeamSchema, type PendingInvite } from "@/lib/validations";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSubmitTeam, useCompleteOnboarding } from "@/hooks/use-onboarding";
import { useCheckEmails } from "@/hooks/use-users";

export default function InviteTeamPage() {
	const router = useRouter();
	const [emails, setEmails] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [chatEnabled, setChatEnabled] = useState(false);
	const [chatComponents, setChatComponents] = useState<string[]>([]);
	const [lookbackWindow, setLookbackWindow] = useState("1year");
	const [interactionsEnabled, setInteractionsEnabled] = useState(false);
	const [patternsEnabled, setPatternsEnabled] = useState(false);
	const [teamManagementEnabled, setTeamManagementEnabled] = useState(false);
	const [apiKeyManagementEnabled, setApiKeyManagementEnabled] = useState(false);
	const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
	const [isLoadingInvites, setIsLoadingInvites] = useState(true);

	const { onboardingId, betterAuthOrgId } = useOnboardingStore();
	const submitTeam = useSubmitTeam();
	const completeOnboarding = useCompleteOnboarding();
	const checkEmails = useCheckEmails();

	const handleEmailsChange = async (newEmails: string[]) => {
		const addedEmails = newEmails.filter(email => !emails.includes(email));

		if (addedEmails.length > 0 && betterAuthOrgId) {
			try {
				const result = await checkEmails.mutateAsync({
					emails: addedEmails,
					organizationId: betterAuthOrgId
				});

				if (result.existingEmails.length > 0) {
					const existingList = result.existingEmails.join(", ");
					toast.error(`These emails are already users: ${existingList}`);
					const filteredEmails = newEmails.filter(
						email => !result.existingEmails.includes(email)
					);
					setEmails(filteredEmails);
					return;
				}
			} catch {
				toast.error("Failed to validate emails");
			}
		}

		setEmails(newEmails);
	};

	useEffect(() => {
		setIsLoadingInvites(false);
	}, []);

	const handleComponentToggle = (component: string) => {
		if (chatComponents.includes(component)) {
			setChatComponents(chatComponents.filter((c) => c !== component));
		} else {
			setChatComponents([...chatComponents, component]);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const permissions: Record<string, unknown> = {};

			if (chatEnabled) {
				permissions.chat = {
					enabled: chatEnabled,
					components: chatComponents as Array<"web" | "cctv" | "social">,
					lookbackWindow: lookbackWindow as "7days" | "30days" | "90days" | "1year" | "all",
				};
			}

			if (interactionsEnabled !== undefined) {
				permissions.interactions = interactionsEnabled;
			}

			if (patternsEnabled !== undefined) {
				permissions.patterns = patternsEnabled;
			}

			if (teamManagementEnabled !== undefined) {
				permissions.teamManagement = teamManagementEnabled;
			}

			if (apiKeyManagementEnabled !== undefined) {
				permissions.apiKeyManagement = apiKeyManagementEnabled;
			}

			const formData = {
				emails,
				permissions,
			};

			const validatedData = inviteTeamSchema.parse(formData);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			const newInvites: PendingInvite[] = validatedData.emails.map((email, index) => {
				const permissions: PendingInvite['permissions'] = {};

				if (validatedData.permissions?.chat) {
					permissions.chat = {
						components: validatedData.permissions.chat.components,
						lookbackWindow: validatedData.permissions.chat.lookbackWindow,
					};
				}

				if (validatedData.permissions?.interactions !== undefined) {
					permissions.interactions = validatedData.permissions.interactions;
				}

				if (validatedData.permissions?.patterns !== undefined) {
					permissions.patterns = validatedData.permissions.patterns;
				}

				if (validatedData.permissions?.teamManagement !== undefined) {
					permissions.teamManagement = validatedData.permissions.teamManagement;
				}

				if (validatedData.permissions?.apiKeyManagement !== undefined) {
					permissions.apiKeyManagement = validatedData.permissions.apiKeyManagement;
				}

				return {
					id: `invite-${Date.now()}-${index}`,
					email,
					initials: email.substring(0, 2).toUpperCase(),
					status: "pending" as const,
					permissions,
					sentAt: new Date(),
				};
			});

			setPendingInvites([...pendingInvites, ...newInvites]);

			toast.success(`Invitations sent to ${emails.length} ${emails.length === 1 ? "person" : "people"}!`);

			setEmails([]);
		} catch (error) {
			console.error("Error sending invitations:", error);

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
		try {
			if (onboardingId) {
				await submitTeam.mutateAsync(onboardingId);
				await completeOnboarding.mutateAsync(onboardingId);
			}
			router.push("/success");
		} catch {
			router.push("/success");
		}
	};

	const handleFinish = async () => {
		try {
			if (onboardingId) {
				await submitTeam.mutateAsync(onboardingId);
				await completeOnboarding.mutateAsync(onboardingId);
			}
			router.push("/success");
		} catch {
			router.push("/success");
		}
	};

	const handleResend = async (id: string) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		toast.success("Invitation resent!");
	};

	const handleRevoke = async (id: string) => {
		setPendingInvites(pendingInvites.filter((invite) => invite.id !== id));
		toast.success("Invitation revoked");
	};

	const getPermissionSummary = () => {
		const tags: string[] = [];

		if (chatEnabled && chatComponents.length > 0) {
			const components = chatComponents.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(" + ");
			const lookback = lookbackWindow === "1year" ? "1y" : lookbackWindow.replace("days", "d");
			tags.push(`Chat: ${components} (≤ ${lookback})`);
		}

		if (interactionsEnabled) tags.push("Interactions");
		if (patternsEnabled) tags.push("Patterns");
		if (teamManagementEnabled) tags.push("Team management");
		if (apiKeyManagementEnabled) tags.push("API key management");

		return tags;
	};

	const permissionTags = getPermissionSummary();

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
							<form id="invite-form" onSubmit={handleSubmit} className="flex flex-col">
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
															<label
																key={component}
																className={`flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded-full transition-colors ${
																	chatComponents.includes(component)
																		? "bg-violet-500/20 border border-violet-500/30"
																		: "bg-white/5 border border-white/10 hover:bg-white/10"
																}`}
															>
																<input
																	type="checkbox"
																	checked={chatComponents.includes(component)}
																	onChange={() => handleComponentToggle(component)}
																	className="rounded-full text-violet-500 border-none bg-transparent focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-3 h-3"
																	aria-label={`Enable ${component} component`}
																/>
																<span
																	className={`text-[10px] font-medium ${
																		chatComponents.includes(component)
																			? "text-violet-100"
																			: "text-gray-400"
																	}`}
																>
																	{component.charAt(0).toUpperCase() + component.slice(1)}
																</span>
															</label>
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
													tag.startsWith("Chat:") || tag.startsWith("API keys:")
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
									disabled={isSubmitting}
								>
									{isSubmitting ? "Sending" : "Send invites"}
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={handleSkip}
									showArrow={false}
									className="flex-1 border-white/10 hover:border-white/20"
								>
									Skip for now
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={handleFinish}
									showArrow={true}
									arrowIcon={<LuArrowRight />}
									className="flex-1 border-white/10 hover:border-white/20"
								>
									Finish setup
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
