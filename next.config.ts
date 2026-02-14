import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' https://js.stripe.com https://static.cloudflareinsights.com 'unsafe-inline' 'unsafe-eval';
  style-src 'self' https://js.stripe.com 'unsafe-inline';
  img-src 'self' https://*.stripe.com https://*.stripecdn.com https://*.crowai.dev https://lh3.googleusercontent.com data: blob:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:* https://*.crowai.dev https://api.stripe.com https://r.stripe.com https://q.stripe.com https://m.stripe.com https://m.stripe.network https://lh3.googleusercontent.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://*.stripe.com https://*.stripecdn.com https://newassets.hcaptcha.com https://*.hcaptcha.com;
  worker-src 'self' blob:;
  child-src 'self' blob: https://js.stripe.com;
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

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "http://localhost:8000/api/:path*",
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

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
