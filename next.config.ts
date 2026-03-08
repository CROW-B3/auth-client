import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' https://js.stripe.com https://*.stripe.com https://*.stripecdn.com https://b.stripecdn.com https://static.cloudflareinsights.com 'unsafe-inline' 'unsafe-eval';
  style-src 'self' https://js.stripe.com https://*.stripe.com https://*.stripecdn.com 'unsafe-inline';
  img-src 'self' https://*.stripe.com https://*.stripecdn.com https://*.crowai.dev https://lh3.googleusercontent.com data: blob:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:* https://*.crowai.dev https://api.stripe.com https://r.stripe.com https://q.stripe.com https://m.stripe.com https://m.stripe.network https://*.stripecdn.com https://lh3.googleusercontent.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://*.stripe.com https://*.stripecdn.com https://b.stripecdn.com https://newassets.hcaptcha.com https://*.hcaptcha.com;
  worker-src 'self' blob:;
  child-src 'self' blob: https://js.stripe.com https://*.stripe.com https://*.stripecdn.com;
  form-action 'self' https://checkout.stripe.com;
`;

const securityHeaders = [
	{
		key: 'Content-Security-Policy',
		value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
	},
	{
		key: 'X-Frame-Options',
		value: 'SAMEORIGIN'
	},
	{
		key: 'X-Content-Type-Options',
		value: 'nosniff'
	},
	{
		key: 'Referrer-Policy',
		value: 'origin-when-cross-origin'
	}
];

const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
	async redirects() {
		return [
			{ source: '/', destination: '/login', permanent: false },
			{ source: '/sign-in', destination: '/login', permanent: false },
			{ source: '/sign-up', destination: '/signup', permanent: false },
		];
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${apiGatewayUrl}/api/:path*`,
			},
		];
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
