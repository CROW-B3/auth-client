import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { PiHeadCircuit } from "react-icons/pi";
import { MdOutlineTouchApp } from "react-icons/md";
import type { PlanCardProps } from "@b3-crow/ui-kit";

export const PLAN_TYPES = ["web", "cctv", "social"] as const;
export const BILLING_PERIODS = ["monthly", "annual"] as const;

export type PlanType = (typeof PLAN_TYPES)[number];
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export interface PlanConfig {
	type: PlanType;
	header: NonNullable<PlanCardProps["header"]>;
	price: {
		monthly: number;
		annual: number;
	};
	featuresTitle: string;
	features: NonNullable<PlanCardProps["features"]>;
	recommended: boolean;
}

export const PLANS: PlanConfig[] = [
	{
		type: "web",
		header: {
			title: "Web",
			description: "Digital journey + interaction capture.",
		},
		price: {
			monthly: 60,
			annual: 50,
		},
		featuresTitle: "INCLUDED LIMITS",
		features: [
			{
				icon: <MdOutlineTouchApp className="text-violet-400" />,
				text: "1M interactions/mo",
			},
			{
				icon: <PiHeadCircuit className="text-violet-400" />,
				text: "1M patterns/mo",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "SDK tracking",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Funnels & drop-off",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Session evidence",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Event API",
			},
		],
		recommended: false,
	},
	{
		type: "cctv",
		header: {
			title: "CCTV",
			description: "Physical behavior + camera signals.",
		},
		price: {
			monthly: 60,
			annual: 50,
		},
		featuresTitle: "INCLUDED LIMITS",
		features: [
			{
				icon: <MdOutlineTouchApp className="text-violet-400" />,
				text: "1M interactions/mo",
			},
			{
				icon: <PiHeadCircuit className="text-violet-400" />,
				text: "1M patterns/mo",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Sites & camera groups",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Agent ingest",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Footfall & queues",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Heatmaps",
			},
		],
		recommended: true,
	},
	{
		type: "social",
		header: {
			title: "Social",
			description: "Mentions, sentiment, and trend signals.",
		},
		price: {
			monthly: 60,
			annual: 50,
		},
		featuresTitle: "INCLUDED LIMITS",
		features: [
			{
				icon: <MdOutlineTouchApp className="text-violet-400" />,
				text: "1M interactions/mo",
			},
			{
				icon: <PiHeadCircuit className="text-violet-400" />,
				text: "1M patterns/mo",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Keyword tracking",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Sentiment & spikes",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Source selection",
			},
			{
				icon: <IoCheckmarkCircleOutline className="text-violet-400" />,
				text: "Regional filters",
			},
		],
		recommended: false,
	},
];
