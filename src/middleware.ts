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
	"/organization",
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

function extractRequestCookieHeaders(request: NextRequest): Record<string, string> {
	return { cookie: request.headers.get("cookie") || "" };
}

async function fetchSessionFromGateway(request: NextRequest): Promise<SessionData | null> {
	try {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/get-session`, {
			headers: extractRequestCookieHeaders(request),
		});

		if (!response.ok) return null;

		const data = await response.json() as { data?: SessionData };
		return data.data || null;
	} catch {
		return null;
	}
}

async function fetchOnboardingStatusByUserId(userId: string, request: NextRequest) {
	try {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/onboarding/user/${userId}`, {
			headers: extractRequestCookieHeaders(request),
		});

		if (response.status === 404 || !response.ok) return null;

		const data = await response.json() as { onboarding?: { currentStep: string; completedSteps: string } };
		return data.onboarding || null;
	} catch {
		return null;
	}
}

async function fetchUserByAuthenticationId(userId: string, request: NextRequest): Promise<{ organizationId?: string } | null> {
	try {
		const response = await fetch(`${API_GATEWAY_URL}/api/v1/users/by-auth-id/${userId}`, {
			headers: extractRequestCookieHeaders(request),
		});

		if (response.status === 404 || !response.ok) return null;

		return await response.json() as { organizationId?: string };
	} catch {
		return null;
	}
}

function isStaticOrApiRoute(pathname: string): boolean {
	return pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".") || pathname.startsWith("/setup-components/");
}

function buildRedirectToLogin(request: NextRequest, pathname: string): NextResponse {
	const loginUrl = request.nextUrl.clone();
	loginUrl.pathname = "/login";
	loginUrl.searchParams.set("redirect", pathname);
	return NextResponse.redirect(loginUrl);
}

function buildRedirectToDashboard(): NextResponse {
	const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3002";
	return NextResponse.redirect(new URL(dashboardUrl));
}

function buildRedirectToPath(request: NextRequest, targetPath: string): NextResponse {
	const redirectUrl = request.nextUrl.clone();
	redirectUrl.pathname = targetPath;
	return NextResponse.redirect(redirectUrl);
}

function resolveOnboardingRedirectPath(completedSteps: string[], requestedStep: number): string | null {
	if (completedSteps.length >= requestedStep) return null;

	const targetRoute = ONBOARDING_ROUTES.find((route) => route.step === completedSteps.length + 1);
	return targetRoute?.path ?? null;
}

async function handleOnboardingRouteAccess(request: NextRequest, sessionUserId: string, onboardingRoute: typeof ONBOARDING_ROUTES[number]): Promise<NextResponse> {
	const user = await fetchUserByAuthenticationId(sessionUserId, request);
	if (user?.organizationId) return buildRedirectToDashboard();

	if (onboardingRoute.path === "/complete-profile") return NextResponse.next();

	const onboarding = await fetchOnboardingStatusByUserId(sessionUserId, request);
	if (!onboarding) return buildRedirectToPath(request, "/organization");

	const completedSteps = JSON.parse(onboarding.completedSteps || "[]");
	const redirectPath = resolveOnboardingRedirectPath(completedSteps, onboardingRoute.step);

	if (redirectPath) return buildRedirectToPath(request, redirectPath);

	return NextResponse.next();
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
	if (isStaticOrApiRoute(pathname)) return NextResponse.next();

	const session = await fetchSessionFromGateway(request);
	if (!session?.user?.id) return buildRedirectToLogin(request, pathname);

	const matchedOnboardingRoute = ONBOARDING_ROUTES.find((route) => pathname === route.path);
	if (matchedOnboardingRoute) return handleOnboardingRouteAccess(request, session.user.id, matchedOnboardingRoute);

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
};
