import type { PackageManager } from "@b3-crow/ui-kit";

export const WEB_SDK_INSTALL_COMMANDS: Record<PackageManager, string> = {
	bun: "bun add @crow/web-sdk",
	npm: "npm install @crow/web-sdk",
	pnpm: "pnpm add @crow/web-sdk",
	yarn: "yarn add @crow/web-sdk",
};

export const getWebSDKInitCode = (apiKey: string) => `import { CrowSDK } from '@crow/web-sdk';

const crow = new CrowSDK({
  apiKey: '${apiKey}',
  orgId: 'your-org-id' // optional
});

// Track page views
crow.track('page_view', {
  path: window.location.pathname
});`;
