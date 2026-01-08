import { z } from "zod";

function isValidCardNumber(value: string): boolean {
	const digitsOnly = value.replace(/[^\d]/g, "");

	if (digitsOnly.length < 13 || digitsOnly.length > 19) {
		return false;
	}

	let sum = 0;
	let shouldDouble = false;

	for (let i = digitsOnly.length - 1; i >= 0; i--) {
		let digit = parseInt(digitsOnly.charAt(i), 10);

		if (Number.isNaN(digit)) {
			return false;
		}

		if (shouldDouble) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}

		sum += digit;
		shouldDouble = !shouldDouble;
	}

	return sum % 10 === 0;
}

function isFutureExpiry(value: string): boolean {
	const parts = value.split("/");
	if (parts.length !== 2) return false;

	const [monthStr, yearStr] = parts;
	const month = Number(monthStr);
	const yearShort = Number(yearStr);

	if (!Number.isInteger(month) || !Number.isInteger(yearShort)) {
		return false;
	}

	const year = 2000 + yearShort;
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	return year > currentYear || (year === currentYear && month >= currentMonth);
}

export const checkoutSchema = z.object({
	cardNumber: z
		.string()
		.min(1, "Card number is required"),
	expiry: z
		.string()
		.regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format")
		.refine(isFutureExpiry, "Expiry date must be in the future"),
	cvc: z
		.string()
		.regex(/^\d{3,4}$/, "CVC must be 3 or 4 digits"),
	billingEmail: z.string().email("Valid email is required"),
	country: z.string().min(1, "Country is required"),
	companyName: z.string().optional(),
	taxId: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
