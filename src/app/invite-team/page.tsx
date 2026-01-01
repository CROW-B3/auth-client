"use client";

import { useState, useEffect } from "react";
import { AnimatedBackground, Button, Navbar, PageHeader, Select, EmailTagInput, PermissionToggle, PendingInviteCard  } from "@b3-crow/ui-kit";
import { LuArrowRight, LuLoader, LuMessageCircle, LuNetwork, LuTrendingUp, LuUsers, LuKey } from "react-icons/lu";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { z } from "zod";
import { inviteTeamSchema, type PendingInvite } from "@/lib/validations";

export default function InviteTeamPage() {
	const [emails, setEmails] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [chatEnabled, setChatEnabled] = useState(true);
	const [chatComponents, setChatComponents] = useState<string[]>(["web", "cctv"]);
	const [lookbackWindow, setLookbackWindow] = useState("1year");
	const [interactionsEnabled, setInteractionsEnabled] = useState(true);
	const [patternsEnabled, setPatternsEnabled] = useState(true);
	const [teamManagementEnabled, setTeamManagementEnabled] = useState(false);
	const [apiKeysEnabled, setApiKeysEnabled] = useState(true);
	const [apiKeyInteractions, setApiKeyInteractions] = useState(true);
	const [apiKeyPatterns, setApiKeyPatterns] = useState(false);
	const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
	const [isLoadingInvites, setIsLoadingInvites] = useState(true);

	// Fetch pending invitations from API
	useEffect(() => {
		const fetchPendingInvites = async () => {
			try {
				const response = await fetch("/api/invitations/pending");

				if (!response.ok) {
					// Only show toast for server errors (500+), not for 404 (API not implemented)
					if (response.status >= 500) {
						toast.error("Failed to load pending invitations");
					}
					throw new Error("Failed to fetch pending invitations");
				}

				const data = await response.json() as { invites?: PendingInvite[] };
				setPendingInvites(data.invites || []);
			} catch (error) {
				console.error("Error fetching pending invites:", error);
				// Network errors or other issues - silently fail in development
				setPendingInvites([]);
			} finally {
				setIsLoadingInvites(false);
			}
		};

		void fetchPendingInvites();
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
			// Build form data object matching schema structure
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

			if (apiKeysEnabled) {
				permissions.apiKeys = {
					enabled: apiKeysEnabled,
					scopes: {
						interactions: apiKeyInteractions,
						patterns: apiKeyPatterns,
					},
				};
			}

			const formData = {
				emails,
				permissions,
			};

			// Validate using schema
			const validatedData = inviteTeamSchema.parse(formData);

			// Make API call to send invitations
			const response = await fetch("/api/invitations/send", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(validatedData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: "Failed to send invitations" })) as { message?: string };
				throw new Error(errorData.message || "Failed to send invitations");
			}

			const result = await response.json() as { invites?: PendingInvite[] };

			// Add new invites to the list (append to the end for chronological order)
			if (result.invites) {
				setPendingInvites([...pendingInvites, ...result.invites]);
			}

			toast.success(`Invitations sent to ${emails.length} ${emails.length === 1 ? "person" : "people"}!`);

			// Reset form
			setEmails([]);
		} catch (error) {
			console.error("Error sending invitations:", error);

			if (error instanceof z.ZodError) {
				// Zod validation errors
				const firstError = error.issues[0];
				toast.error(firstError?.message || "Please fix validation errors");
			} else {
				// API or other errors
				const errorMessage = error instanceof Error ? error.message : "Failed to send invitations";
				toast.error(errorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSkip = () => {
		toast.success("You can invite team members later!");
	};

	const handleResend = async (id: string) => {
		try {
			const response = await fetch(`/api/invitations/${id}/resend`, {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Failed to resend invitation");
			}

			toast.success("Invitation resent!");
		} catch (error) {
			console.error("Error resending invitation:", error);
			toast.error("Failed to resend invitation");
		}
	};

	const handleRevoke = async (id: string) => {
		try {
			const response = await fetch(`/api/invitations/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to revoke invitation");
			}

			setPendingInvites(pendingInvites.filter((invite) => invite.id !== id));
			toast.success("Invitation revoked");
		} catch (error) {
			console.error("Error revoking invitation:", error);
			toast.error("Failed to revoke invitation");
		}
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

		if (apiKeysEnabled) {
			const scopes: string[] = [];
			if (apiKeyInteractions) scopes.push("Interactions");
			if (apiKeyPatterns) scopes.push("Patterns");
			if (scopes.length > 0) {
				tags.push(`API keys: ${scopes.join(", ")}`);
			}
		}

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
							className="flex flex-col gap-5 w-full max-w-[520px] mx-auto lg:mx-0 justify-self-end"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
						>
							<form onSubmit={handleSubmit} className="flex flex-col gap-5">
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
								>
									<EmailTagInput emails={emails} onEmailsChange={setEmails} />
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
											title="API keys"
											description="Create and manage API keys."
											enabled={apiKeysEnabled}
											onToggle={setApiKeysEnabled}
											expandable={true}
											expanded={apiKeysEnabled}
											highlighted={apiKeysEnabled}
										>
											<div className="mt-2 pl-11">
												<label className="text-[10px] font-medium text-gray-400 mb-2 block">
													Key scopes
												</label>
												<div className="flex gap-4">
													<div className="flex items-center gap-2">
														<label className="relative inline-flex items-center cursor-pointer scale-75 origin-left">
															<input
																type="checkbox"
																checked={apiKeyInteractions}
																onChange={(e) => setApiKeyInteractions(e.target.checked)}
																className="sr-only peer"
																aria-label="Enable API key access for Interactions"
															/>
															<div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
														</label>
														<span className="text-[10px] text-gray-300">Interactions</span>
													</div>
													<div className="flex items-center gap-2">
														<label className="relative inline-flex items-center cursor-pointer scale-75 origin-left">
															<input
																type="checkbox"
																checked={apiKeyPatterns}
																onChange={(e) => setApiKeyPatterns(e.target.checked)}
																className="sr-only peer"
																aria-label="Enable API key access for Patterns"
															/>
															<div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
														</label>
														<span className="text-[10px] text-gray-300">Patterns</span>
													</div>
												</div>
											</div>
										</PermissionToggle>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
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

								<motion.div
									className="pt-4 border-t border-white/5"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
								>
									<div className="flex flex-col gap-3">
										<div className="flex items-center gap-3">
											<Button
												variant="solid"
												type="submit"
												className="bg-violet-600 hover:bg-violet-700 shadow-glow hover:shadow-glow-hover flex-grow disabled:opacity-50 disabled:cursor-not-allowed"
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
												className="border-white/10 hover:border-white/20"
											>
												Skip for now
											</Button>
										</div>
										<p className="text-[11px] text-gray-500 text-center">
											Invites are sent by email. Access activates after acceptance.
										</p>
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

							<div className="flex flex-col h-full overflow-y-auto scrollbar-hide pr-1">
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
				</div>
			</main>
		</div>
	);
}
