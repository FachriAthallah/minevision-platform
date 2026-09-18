DROP TABLE IF EXISTS public.admin_activity_logs;
DROP TABLE IF EXISTS public.analytics_events;
DROP TABLE IF EXISTS public.media_assets;
DROP TABLE IF EXISTS public.site_setting_versions;
DROP TABLE IF EXISTS public.site_settings;

ALTER TABLE public.user_role_assignments DROP COLUMN IF EXISTS status;

DROP TYPE IF EXISTS public.site_setting_state;
DROP TYPE IF EXISTS public.media_asset_kind;
DROP TYPE IF EXISTS public.analytics_event_type;
DROP TYPE IF EXISTS public.analytics_device_category;
DROP TYPE IF EXISTS public.admin_activity_result;
DROP TYPE IF EXISTS public.role_assignment_status;

DELETE FROM storage.buckets WHERE id = 'admin-media';

DELETE FROM public.roles WHERE key IN ('owner', 'analyst');