"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAdminAccessOrNull } from "./lib/authorization";
import { recordAdminActivity } from "./lib/activity-log";

export async function adminSignOut() {
  const access = await getAdminAccessOrNull();

  if (access) {
    await recordAdminActivity({
      actor: {
        userId: access.identity.id,
        email: access.identity.email,
        displayName: access.identity.displayName,
      },
      action: "admin_logout",
      resourceType: "admin_session",
      resourceId: access.identity.id,
    });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/admin/login");
}