import { z } from "zod";
import { PLAN_TYPES, BILLING_PERIODS } from "@/config/plans";

export const planSelectionSchema = z.object({
	selectedPlans: z
		.array(z.enum(PLAN_TYPES))
		.min(1, "Please select at least one module")
		.max(3, "Maximum 3 modules allowed"),
	billingPeriod: z.enum(BILLING_PERIODS, {
		message: "Please select a billing period",
	}),
	autoScale: z.boolean().optional().default(false),
});

export type PlanSelectionFormData = z.infer<typeof planSelectionSchema>;
