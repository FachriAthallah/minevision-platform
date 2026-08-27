CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(120),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_role_assignments_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_assigned_by_auth_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_username_format_check" CHECK ("username" ~ '^[a-z0-9_]{3,50}$');
--> statement-breakpoint
CREATE UNIQUE INDEX "roles_key_unique_idx" ON "roles" USING btree ("key");
--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_username_unique_idx" ON "user_profiles" USING btree ("username");
--> statement-breakpoint
CREATE INDEX "user_role_assignments_role_id_idx" ON "user_role_assignments" USING btree ("role_id");
--> statement-breakpoint
CREATE INDEX "user_role_assignments_assigned_by_idx" ON "user_role_assignments" USING btree ("assigned_by");
--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_role_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "roles_authenticated_read" ON "roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
--> statement-breakpoint
CREATE POLICY "user_profiles_read_own" ON "user_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "user_profiles_update_own" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT auth.uid()) = "user_id") WITH CHECK ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "user_role_assignments_read_own" ON "user_role_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT auth.uid()) = "user_id");
--> statement-breakpoint
INSERT INTO "roles" ("key", "name", "description") VALUES
  ('user', 'User', 'Akun pengguna publik MineVision.'),
  ('administrator', 'Administrator', 'Akses penuh ke private Admin Dashboard.'),
  ('content_editor', 'Content Editor', 'Mengelola konten naratif MineVision.'),
  ('data_editor', 'Data Editor', 'Mengelola dataset MineVision.'),
  ('data_verifier', 'Data Verifier', 'Memverifikasi data sebelum publikasi.'),
  ('publisher', 'Publisher', 'Menyetujui publikasi konten dan data.')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = now();
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "private";
--> statement-breakpoint
REVOKE ALL ON SCHEMA "private" FROM PUBLIC;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "private"."handle_new_auth_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_username text;
  candidate_username text;
  default_role_id uuid;
BEGIN
  base_username := lower(
    coalesce(
      nullif(NEW.raw_user_meta_data ->> 'username', ''),
      nullif(NEW.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(NEW.email, ''), '@', 1), ''),
      'member'
    )
  );

  base_username := btrim(
    regexp_replace(base_username, '[^a-z0-9_]+', '_', 'g'),
    '_'
  );

  IF length(base_username) < 3 THEN
    base_username := 'member';
  END IF;

  candidate_username := left(base_username, 50);

  IF EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE username = candidate_username
  ) THEN
    candidate_username := left(base_username, 15) || '_' || replace(NEW.id::text, '-', '');
  END IF;

  INSERT INTO public.user_profiles (
    user_id,
    username,
    display_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    candidate_username,
    coalesce(
      nullif(NEW.raw_user_meta_data ->> 'display_name', ''),
      nullif(NEW.raw_user_meta_data ->> 'full_name', ''),
      nullif(NEW.raw_user_meta_data ->> 'name', '')
    ),
    coalesce(
      nullif(NEW.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(NEW.raw_user_meta_data ->> 'picture', '')
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id
  INTO default_role_id
  FROM public.roles
  WHERE key = 'user';

  IF default_role_id IS NULL THEN
    RAISE EXCEPTION 'Default MineVision user role is not configured';
  END IF;

  INSERT INTO public.user_role_assignments (user_id, role_id)
  VALUES (NEW.id, default_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."handle_new_auth_user"() FROM PUBLIC, "anon", "authenticated";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
--> statement-breakpoint
CREATE TRIGGER "on_auth_user_created"
AFTER INSERT ON "auth"."users"
FOR EACH ROW EXECUTE FUNCTION "private"."handle_new_auth_user"();
