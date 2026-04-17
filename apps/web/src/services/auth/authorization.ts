import type { CurrentUserProfile } from "./types";

export function canManageOwnedResource(
  profile: CurrentUserProfile,
  ownerUserId: string,
): boolean {
  return profile.role === "ADMIN" || profile.id === ownerUserId;
}
