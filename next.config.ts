import type { NextConfig } from "next";


const securityHeaders = [
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
	async redirects() {
		return [
			{ source: '/', destination: '/login', permanent: false },
			{ source: '/sign-in', destination: '/login', permanent: false },
			{ source: '/sign-up', destination: '/signup', permanent: false },
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
