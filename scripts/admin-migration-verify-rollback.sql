DO $$
BEGIN
  IF EXISTS (
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
    RAISE EXCEPTION 'Tabel admin masih tersedia setelah rollback.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_role_assignments' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Kolom user_role_assignments.status masih tersedia.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname IN (
      'analytics_event_type',
      'role_assignment_status',
      'site_setting_state',
      'media_asset_kind',
      'admin_activity_result',
      'analytics_device_category'
    )
  ) THEN
    RAISE EXCEPTION 'Enum admin masih tersedia setelah rollback.';
  END IF;

  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'admin-media') THEN
    RAISE EXCEPTION 'Bucket admin-media masih tersedia setelah rollback.';
  END IF;

  IF EXISTS (SELECT 1 FROM roles WHERE key IN ('owner', 'analyst')) THEN
    RAISE EXCEPTION 'Role owner/analyst masih tersedia setelah rollback.';
  END IF;

  RAISE NOTICE 'VERIFY ROLLBACK 0022: OK';
END $$;