type ChatPermission = {
  enabled: boolean;
  components: Array<"web" | "cctv" | "social">;
  lookbackWindow: "7days" | "30days" | "90days" | "1year" | "all";
};

export const buildPermissions = (
  chatEnabled: boolean,
  chatComponents: string[],
  lookbackWindow: string,
  interactionsEnabled: boolean,
  patternsEnabled: boolean,
  teamManagementEnabled: boolean,
  apiKeyManagementEnabled: boolean
): Record<string, unknown> => {
  const permissions: Record<string, unknown> = {};

  if (chatEnabled) {
    permissions.chat = {
      enabled: chatEnabled,
      components: chatComponents as Array<"web" | "cctv" | "social">,
      lookbackWindow: lookbackWindow as ChatPermission["lookbackWindow"],
    };
  }

  if (interactionsEnabled !== undefined) {
    permissions.interactions = interactionsEnabled;
  }

  if (patternsEnabled !== undefined) {
    permissions.patterns = patternsEnabled;
  }

  if (teamManagementEnabled !== undefined) {
    permissions.teamManagement = teamManagementEnabled;
  }

  if (apiKeyManagementEnabled !== undefined) {
    permissions.apiKeyManagement = apiKeyManagementEnabled;
  }

  return permissions;
};

const formatComponentName = (component: string): string => {
  return component.charAt(0).toUpperCase() + component.slice(1);
};

const formatLookbackWindow = (window: string): string => {
  return window === "1year" ? "1y" : window.replace("days", "d");
};

export const buildPermissionSummary = (
  chatEnabled: boolean,
  chatComponents: string[],
  lookbackWindow: string,
  interactionsEnabled: boolean,
  patternsEnabled: boolean,
  teamManagementEnabled: boolean,
  apiKeyManagementEnabled: boolean
): string[] => {
  const tags: string[] = [];

  if (chatEnabled && chatComponents.length > 0) {
    const components = chatComponents.map(formatComponentName).join(" + ");
    const lookback = formatLookbackWindow(lookbackWindow);
    tags.push(`Chat: ${components} (≤ ${lookback})`);
  }

  if (interactionsEnabled) {
    tags.push("Interactions");
  }

  if (patternsEnabled) {
    tags.push("Patterns");
  }

  if (teamManagementEnabled) {
    tags.push("Team management");
  }

  if (apiKeyManagementEnabled) {
    tags.push("API key management");
  }

  return tags;
};
