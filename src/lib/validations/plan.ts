import { z } from "zod";

export const planSelectionSchema = z.object({
	selectedPlans: z
		.array(z.enum(["web", "cctv", "social"]))
		.min(1, "Please select at least one module")
		.max(3, "Maximum 3 modules allowed"),
	billingPeriod: z.enum(["monthly", "annual"], {
		message: "Please select a billing period",
	}),
	autoScale: z.boolean().optional().default(false),
});

export type PlanSelectionFormData = z.infer<typeof planSelectionSchema>;
