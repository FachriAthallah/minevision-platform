DO $$
DECLARE
  missing_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'admin_activity_logs',
        'analytics_events',
        'media_assets',
        'site_settings',
        'site_setting_versions'
      )
  ) THEN
    RAISE EXCEPTION 'Tabel admin tidak tersedia setelah migration 0022.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_role_assignments' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Kolom user_role_assignments.status tidak tersedia.';
  END IF;

  IF (
    SELECT count(*) FROM roles
    WHERE key IN ('owner', 'analyst')
  ) <> 2 THEN
    RAISE EXCEPTION 'Role owner/analyst tidak tersedia.';
  END IF;

  IF (
    SELECT count(*) FROM pg_type
    WHERE typname IN (
      'analytics_event_type',
      'role_assignment_status',
      'site_setting_state',
      'media_asset_kind',
      'admin_activity_result',
      'analytics_device_category'
    )
  ) <> 6 THEN
    RAISE EXCEPTION 'Enum admin tidak lengkap.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname IN (
      'site_settings',
      'analytics_events',
      'admin_activity_logs',
      'media_assets',
      'site_setting_versions'
    )
      AND relrowsecurity = false
  ) THEN
    RAISE EXCEPTION 'RLS belum aktif pada tabel admin.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'admin-media'
  ) THEN
    RAISE EXCEPTION 'Bucket admin-media tidak tersedia.';
  END IF;

  RAISE NOTICE 'VERIFY 0022: OK';
END $$;