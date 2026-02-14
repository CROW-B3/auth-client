import type { PackageManager } from "@b3-crow/ui-kit";

export const WEB_SDK_INSTALL_COMMANDS: Record<PackageManager, string> = {
	bun: "bun add @b3-crow/website-hook-sdk",
	npm: "npm install @b3-crow/website-hook-sdk",
	pnpm: "pnpm add @b3-crow/website-hook-sdk",
	yarn: "yarn add @b3-crow/website-hook-sdk",
};

export const getWebSDKInitCode = (apiKey: string) => `import { initializeCrow } from '@b3-crow/website-hook-sdk';

const crow = await initializeCrow({
  projectId: '${apiKey}',
  debug: true
});`;
