import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Truly public routes — no session required.
// Onboarding routes (/organization, /checkout, etc.) are NOT here;
// they require an authenticated session and are handled by ONBOARDING_ROUTES logic.
const PUBLIC_ROUTES = [
	"/login",
	"/signup",
	"/auth/callback",
	"/accept-invite",
	"/terms",
	"/privacy",
	"/",
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

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || process.env.API_GATEWAY_URL || "https://dev.api.crowai.dev";

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

		const data = await response.json() as SessionData | { data?: SessionData };
		// better-auth returns { session, user } directly or wrapped in { data: { session, user } }
		if ('session' in data && 'user' in data) return data as SessionData;
		if ('data' in data && data.data) return data.data;
		return null;
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

		const data = await response.json() as { onboarding?: { currentStep: string; completedSteps: string; status?: string } };
		return data.onboarding || null;
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
	// Allow access to step N if the user has completed at least N-1 steps.
	// e.g. 0 completed steps → can access step 1; 1 completed step → can access step 2, etc.
	if (completedSteps.length + 1 >= requestedStep) return null;

	const targetRoute = ONBOARDING_ROUTES.find((route) => route.step === completedSteps.length + 1);
	return targetRoute?.path ?? null;
}

async function handleOnboardingRouteAccess(request: NextRequest, sessionUserId: string, onboardingRoute: typeof ONBOARDING_ROUTES[number]): Promise<NextResponse> {
	if (onboardingRoute.path === "/complete-profile") return NextResponse.next();

	const onboarding = await fetchOnboardingStatusByUserId(sessionUserId, request);

	console.log(`[middleware:onboarding] path=${onboardingRoute.path} step=${onboardingRoute.step} userId=${sessionUserId} onboarding=${JSON.stringify(onboarding)}`);

	if (!onboarding) {
		// No onboarding record found — do NOT redirect to dashboard based on organizationId,
		// because the record may not have propagated yet (D1 eventual consistency) or the
		// fetch failed transiently. Just guide the user to step 1 if they're ahead of it.
		console.log(`[middleware:onboarding] no-onboarding — redirecting step>1 to /organization`);
		if (onboardingRoute.step > 1) return buildRedirectToPath(request, "/organization");
		return NextResponse.next();
	}

	// User has an active onboarding record — check its status.
	const onboardingStatus = (onboarding as { currentStep?: string; completedSteps?: string; status?: string }).status;
	console.log(`[middleware:onboarding] status=${onboardingStatus} completedSteps=${onboarding.completedSteps}`);
	if (onboardingStatus === "completed") {
		return buildRedirectToDashboard();
	}

	const completedSteps = JSON.parse(onboarding.completedSteps || "[]");
	const redirectPath = resolveOnboardingRedirectPath(completedSteps, onboardingRoute.step);
	console.log(`[middleware:onboarding] completedSteps=${JSON.stringify(completedSteps)} redirectPath=${redirectPath}`);

	if (redirectPath) return buildRedirectToPath(request, redirectPath);

	return NextResponse.next();
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
	if (isStaticOrApiRoute(pathname)) return NextResponse.next();

	const session = await fetchSessionFromGateway(request);

	// If session check fails but the user has auth cookies, allow through
	// and let client-side handle auth (avoids blocking on cold-start 530s)
	const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('better-auth'));
	if (!session?.user?.id) {
		if (hasAuthCookie) {
			// User has cookies but session fetch failed (likely cold start) - allow through
			return NextResponse.next();
		}
		return buildRedirectToLogin(request, pathname);
	}

	const matchedOnboardingRoute = ONBOARDING_ROUTES.find((route) => pathname === route.path);
	if (matchedOnboardingRoute) return handleOnboardingRouteAccess(request, session.user.id, matchedOnboardingRoute);

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
};
