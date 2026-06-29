import type { PlanType } from "@/config/plans";

/**
 * Add-ons — pricing source of truth (mirrors the discipline of plans.tsx).
 *
 * Modules (Web/CCTV/Social) answer "what happened in one channel". Add-ons
 * either DEEPEN a single module (scope = that PlanType) or form the
 * cross-module INTELLIGENCE layer (scope = "platform"), priced separately so
 * customers only pay for what they use.
 *
 * Pricing follows the module model: `monthly` is the per-month rate; `annual`
 * is the per-month rate when billed yearly (~17% off, matching plans.tsx).
 * `icon` is a Lucide icon name (lucide.dev) — the UI maps it to a component,
 * so this file stays a pure data source with no rendering deps.
 *
 * The marketing site (landing-client) MUST mirror this; do not invent add-on
 * prices anywhere else.
 */

export type AddOnScope = PlanType | "platform";

export interface AddOnConfig {
	id: string;
	scope: AddOnScope;
	title: string;
	description: string;
	icon: string;
	price: {
		monthly: number;
		annual: number;
	};
	/** Eligibility / prerequisite note shown under the price. */
	requirement: string;
	/** What the add-on unlocks. */
	unlocks: string[];
}

export const ADD_ONS: AddOnConfig[] = [
	// ---- CCTV (Observation) ----
	{
		id: "cctv-extra-cameras",
		scope: "cctv",
		title: "Extra Camera Pack",
		description: "Add capacity beyond the included camera streams.",
		icon: "Camera",
		price: { monthly: 20, annual: 17 },
		requirement: "Requires CCTV",
		unlocks: ["+5 camera streams", "Auto-calibration", "Full analytics suite on every stream"],
	},
	{
		id: "cctv-queue-wait",
		scope: "cctv",
		title: "Queue & Wait-Time",
		description: "Measure and alert on queues and service times.",
		icon: "Clock",
		price: { monthly: 25, annual: 21 },
		requirement: "Requires CCTV",
		unlocks: ["Live queue length", "Wait-time SLAs & alerts", "Abandonment tracking"],
	},
	{
		id: "cctv-demographics",
		scope: "cctv",
		title: "Demographic Insights",
		description: "Anonymized audience composition — privacy-safe.",
		icon: "Users",
		price: { monthly: 30, annual: 25 },
		requirement: "Requires CCTV",
		unlocks: ["Anonymized age & gender bands", "Group vs solo, new vs repeat", "No face or PII storage"],
	},
	// ---- Web (Digital) ----
	{
		id: "web-experiments",
		scope: "web",
		title: "Experiment & A/B Intelligence",
		description: "Read out experiments and protect key metrics.",
		icon: "FlaskConical",
		price: { monthly: 30, annual: 25 },
		requirement: "Requires Web",
		unlocks: ["A/B & multivariate readouts", "Automatic significance", "Guardrail-metric alerts"],
	},
	{
		id: "web-replay-vault",
		scope: "web",
		title: "Extended Replay Vault",
		description: "Longer retention and full-fidelity session capture.",
		icon: "History",
		price: { monthly: 20, annual: 17 },
		requirement: "Requires Web",
		unlocks: ["12-month replay retention", "100% session capture", "MP4 export"],
	},
	{
		id: "web-warehouse-sync",
		scope: "web",
		title: "Warehouse Sync",
		description: "Stream raw events into your data warehouse.",
		icon: "Database",
		price: { monthly: 30, annual: 25 },
		requirement: "Requires Web",
		unlocks: ["Hourly event export", "Snowflake / BigQuery / S3", "Schema-mapped"],
	},
	// ---- Social (Sentiment) ----
	{
		id: "social-crisis-alerts",
		scope: "social",
		title: "Real-Time Crisis Alerts",
		description: "Catch spikes and negativity the moment they start.",
		icon: "BellRing",
		price: { monthly: 25, annual: 21 },
		requirement: "Requires Social",
		unlocks: ["Volume & negativity spike detection", "Severity scoring", "Instant escalation"],
	},
	{
		id: "social-influencer-reach",
		scope: "social",
		title: "Influencer & Reach",
		description: "See who drives your mentions and how far they travel.",
		icon: "Megaphone",
		price: { monthly: 25, annual: 21 },
		requirement: "Requires Social",
		unlocks: ["Top voices", "Reach / impressions / EMV", "Audience overlap"],
	},
	{
		id: "social-competitor-benchmark",
		scope: "social",
		title: "Deep Competitor Benchmarking",
		description: "Go beyond monitoring into share-of-voice and gaps.",
		icon: "Swords",
		price: { monthly: 30, annual: 25 },
		requirement: "Requires Social",
		unlocks: ["Share-of-voice", "Sentiment vs rivals", "Theme-gap analysis"],
	},
	// ---- Platform (cross-module intelligence) ----
	{
		id: "platform-cross-channel-validation",
		scope: "platform",
		title: "Cross-Channel Validation",
		description: "Corroborate a finding against a second channel.",
		icon: "ShieldCheck",
		price: { monthly: 30, annual: 25 },
		requirement: "Requires 2+ modules",
		unlocks: ["Web ↔ CCTV ↔ Social correlation", "Confidence scoring on insights", "Fewer false positives"],
	},
	{
		id: "platform-agent-to-agent",
		scope: "platform",
		title: "Agent-to-Agent Correlation",
		description: "Let CROW's agents reason across channels — and expose it to yours.",
		icon: "Network",
		price: { monthly: 40, annual: 33 },
		requirement: "Requires 2+ modules",
		unlocks: ["A2A protocol access", "MCP server endpoint", "Inter-channel agent handoff"],
	},
	{
		id: "platform-advanced-insight",
		scope: "platform",
		title: "Advanced Insight Generation",
		description: "Deeper synthesis and predictive reasoning on top of the base layer.",
		icon: "Sparkles",
		price: { monthly: 50, annual: 42 },
		requirement: "Any module",
		unlocks: ["Synthesis + Red-Team passes", "Predictive forecasting", "Higher reasoning frequency"],
	},
	{
		id: "platform-unified-journey",
		scope: "platform",
		title: "Unified Customer Journey",
		description: "Stitch online, in-store, and social into one timeline.",
		icon: "GitMerge",
		price: { monthly: 40, annual: 33 },
		requirement: "Requires 2+ modules",
		unlocks: ["Online → in-store → social timeline", "Cross-channel attribution", "One customer view"],
	},
	{
		id: "platform-ask-crow-pro",
		scope: "platform",
		title: "Ask CROW Pro",
		description: "More headroom for the conversational analyst.",
		icon: "MessageSquare",
		price: { monthly: 20, annual: 17 },
		requirement: "Any module",
		unlocks: ["Higher query limits", "Longer context window", "Scheduled reports"],
	},
];

/** Add-ons scoped to a given module, or the cross-module "platform" layer. */
export const getAddOns = (scope: AddOnScope): AddOnConfig[] =>
	ADD_ONS.filter((addon) => addon.scope === scope);

/** Per-module monthly-equivalent for the chosen billing period. */
export const getAddOnPrice = (addon: AddOnConfig, billing: "monthly" | "annual"): number =>
	billing === "annual" ? addon.price.annual : addon.price.monthly;
