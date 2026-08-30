INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'industry-reports',
  'industry-reports',
  false,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;