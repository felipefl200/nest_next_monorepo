import type { UserRole } from "../auth/auth.types";

export type ActorContext = {
  actorUserId: string;
  actorRole: UserRole;
};
