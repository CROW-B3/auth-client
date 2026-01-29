import type { PendingInvite } from "@/lib/validations";

type InvitePermissions = {
  chat?: {
    components: Array<"web" | "cctv" | "social">;
    lookbackWindow: "7days" | "30days" | "90days" | "1year" | "all";
  };
  interactions?: boolean;
  patterns?: boolean;
  teamManagement?: boolean;
  apiKeyManagement?: boolean;
};

const generateInviteId = (index: number): string => {
  return `invite-${Date.now()}-${index}`;
};

const extractInitials = (email: string): string => {
  return email.substring(0, 2).toUpperCase();
};

const buildInvitePermissions = (
  validatedPermissions: InvitePermissions | undefined
): PendingInvite["permissions"] => {
  const permissions: PendingInvite["permissions"] = {};

  if (validatedPermissions?.chat) {
    permissions.chat = {
      components: validatedPermissions.chat.components,
      lookbackWindow: validatedPermissions.chat.lookbackWindow,
    };
  }

  if (validatedPermissions?.interactions !== undefined) {
    permissions.interactions = validatedPermissions.interactions;
  }

  if (validatedPermissions?.patterns !== undefined) {
    permissions.patterns = validatedPermissions.patterns;
  }

  if (validatedPermissions?.teamManagement !== undefined) {
    permissions.teamManagement = validatedPermissions.teamManagement;
  }

  if (validatedPermissions?.apiKeyManagement !== undefined) {
    permissions.apiKeyManagement = validatedPermissions.apiKeyManagement;
  }

  return permissions;
};

export const createPendingInvite = (
  email: string,
  index: number,
  validatedPermissions: InvitePermissions | undefined
): PendingInvite => {
  return {
    id: generateInviteId(index),
    email,
    initials: extractInitials(email),
    status: "pending" as const,
    permissions: buildInvitePermissions(validatedPermissions),
    sentAt: new Date(),
  };
};

export const createPendingInvites = (
  emails: string[],
  validatedPermissions: InvitePermissions | undefined
): PendingInvite[] => {
  return emails.map((email, index) =>
    createPendingInvite(email, index, validatedPermissions)
  );
};

export const updateInviteSentTime = (
  invites: PendingInvite[],
  inviteId: string
): PendingInvite[] => {
  return invites.map((invite) =>
    invite.id === inviteId ? { ...invite, sentAt: new Date() } : invite
  );
};

export const removeInvite = (
  invites: PendingInvite[],
  inviteId: string
): PendingInvite[] => {
  return invites.filter((invite) => invite.id !== inviteId);
};
