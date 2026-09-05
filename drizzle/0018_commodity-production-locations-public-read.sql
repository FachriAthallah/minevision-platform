ALTER TABLE "public"."commodity_production_locations"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "commodity_production_locations_public_read"
ON "public"."commodity_production_locations"
AS PERMISSIVE
FOR SELECT
TO "anon", "authenticated"
USING (
  "commodity_production_locations"."verification_status" = 'verified'
  AND "commodity_production_locations"."publication_status" = 'published'
  AND EXISTS (
    SELECT 1
    FROM "public"."commodities" AS commodity
    WHERE commodity.id =
      "commodity_production_locations"."commodity_id"
      AND commodity.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM "public"."regions" AS region
    WHERE region.id =
      "commodity_production_locations"."region_id"
      AND region.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM "public"."sources" AS source
    WHERE source.id =
      "commodity_production_locations"."source_id"
      AND source.is_active = true
      AND source.verification_status = 'verified'
  )
);
--> statement-breakpoint

REVOKE ALL PRIVILEGES
ON TABLE "public"."commodity_production_locations"
FROM "anon", "authenticated";
--> statement-breakpoint

GRANT SELECT
ON TABLE "public"."commodity_production_locations"
TO "anon", "authenticated";