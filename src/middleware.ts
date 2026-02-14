import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
	"/login",
	"/signup",
	"/auth/callback",
	"/accept-invite",
	"/terms",
	"/privacy",
	"/",
	"/organization", // Temporarily public to fix session issue
	"/choose-modules",
	"/checkout",
	"/checkout/cancel",
	"/checkout/success",
	"/connect-products",
	"/setup-components",
	"/invite-team",
	"/complete-profile",
];

const ONBOARDING_ROUTES = [
	{ path: "/complete-profile", step: 0 },
	{ path: "/organization", step: 1 },
	{ path: "/choose-modules", step: 2 },
	{ path: "/checkout", step: 3 },
	{ path: "/connect-products", step: 4 },
	{ path: "/setup-components", step: 5 },
	{ path: "/invite-team", step: 6 },
];

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

interface SessionUser {
	id: string;
	name: string;
	email: string;
	image?: string;
}

interface SessionData {
	session: {
		userId: string;
		expiresAt: number;
	};
	user: SessionUser;
}

async function getSession(request: NextRequest): Promise<SessionData | null> {
	try {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/get-session`, {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json() as { data?: SessionData };
		return data.data || null;
	} catch {
		return null;
	}
}

async function getOnboardingStatus(userId: string, request: NextRequest) {
	try {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/user/${userId}`, {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			return null;
		}

		const data = await response.json() as { onboarding?: { currentStep: string; completedSteps: string } };
		return data.onboarding || null;
	} catch {
		return null;
	}
}

async function getUserByAuthId(userId: string, request: NextRequest): Promise<{ organizationId?: string } | null> {
	try {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/users/by-auth-id/${userId}`, {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			return null;
		}

		return await response.json() as { organizationId?: string };
	} catch {
		return null;
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (PUBLIC_ROUTES.includes(pathname)) {
		return NextResponse.next();
	}

	if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".") || pathname.startsWith("/setup-components/")) {
		return NextResponse.next();
	}

	const session = await getSession(request);

	if (!session?.user?.id) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("redirect", pathname);
		return NextResponse.redirect(url);
	}

	const onboardingRoute = ONBOARDING_ROUTES.find((route) => pathname === route.path);

	if (onboardingRoute) {
		const user = await getUserByAuthId(session.user.id, request);

		if (user && user.organizationId) {
			const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
			return NextResponse.redirect(new URL(dashboardUrl));
		}

		if (pathname === "/complete-profile") {
			return NextResponse.next();
		}

		const onboarding = await getOnboardingStatus(session.user.id, request);

		if (!onboarding) {
			const url = request.nextUrl.clone();
			url.pathname = "/organization";
			return NextResponse.redirect(url);
		}

		const completedSteps = JSON.parse(onboarding.completedSteps || "[]");
		const currentStep = onboardingRoute.step;

		if (completedSteps.length < currentStep) {
			const targetRoute = ONBOARDING_ROUTES.find((r) => r.step === completedSteps.length + 1);
			if (targetRoute) {
				const url = request.nextUrl.clone();
				url.pathname = targetRoute.path;
				return NextResponse.redirect(url);
			}
		}

		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
};
