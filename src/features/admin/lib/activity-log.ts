import "server-only";

import { db } from "@/db";
import { adminActivityLogs } from "@/db/schema";

export type AdminActor = {
  userId: string;
  email: string | null;
  displayName: string | null;
};

export type AdminActivityInput = {
  actor: AdminActor;
  action: string;
  resourceType?: string;
  resourceId?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  result?: "success" | "failure";
  correlationId?: string;
  requestId?: string;
};

export async function recordAdminActivity(input: AdminActivityInput) {
  try {
    await db.insert(adminActivityLogs).values({
      actorId: input.actor.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      beforeSummary: input.beforeSummary ?? {},
      afterSummary: input.afterSummary ?? {},
      result: input.result ?? "success",
      correlationId: input.correlationId,
      requestId: input.requestId,
    });
  } catch (error) {
    console.error(
      "Gagal mencatat akvitas admin. (Pencatatan tidak blocking operasi utama.)",
      error instanceof Error ? error.message : String(error),
    );
  }
}