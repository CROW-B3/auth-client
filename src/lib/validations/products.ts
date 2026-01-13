import { z } from "zod";

export const productFeedUrlSchema = z.object({
	feedUrl: z
		.string()
		.min(1, "Please enter a URL")
		.url("Please enter a valid URL")
		.refine(
			(url) => {
				try {
					const parsed = new URL(url);
					return parsed.protocol === "https:" || parsed.protocol === "http:";
				} catch {
					return false;
				}
			},
			{ message: "URL must use HTTP or HTTPS protocol" }
		),
});

export const productFileSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
		.refine(
			(file) => {
				const validExtensions = [".json", ".csv"];
				return validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
			},
			{ message: "File must be a CSV or JSON file" }
		),
});

export const connectProductsSchema = z.discriminatedUnion("method", [
	z.object({
		method: z.literal("url"),
		feedUrl: productFeedUrlSchema.shape.feedUrl,
	}),
	z.object({
		method: z.literal("file"),
		file: productFileSchema.shape.file,
	}),
]);

export type ProductFeedUrlData = z.infer<typeof productFeedUrlSchema>;
export type ProductFileData = z.infer<typeof productFileSchema>;
export type ConnectProductsData = z.infer<typeof connectProductsSchema>;
