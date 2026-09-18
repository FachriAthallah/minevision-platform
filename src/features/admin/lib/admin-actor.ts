import "server-only";

import type { AdminAccess } from "./authorization";
import type { AdminActor } from "./activity-log";

export function administratorActor(access: AdminAccess): AdminActor {
  return {
    userId: access.identity.id,
    email: access.identity.email,
    displayName: access.identity.displayName,
  };
}