-- =============================================================================
-- VOICE NOTES — Storage bucket + RLS policies
-- Private bucket for tenant-scoped audio recordings
-- Path structure: {tenantId}/{userId}/{uuid}.{ext}
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-notes',
  'voice-notes',
  false,
  26214400,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS — authenticated users can only access their own tenant+user folder
-- ---------------------------------------------------------------------------

create policy "voice notes: tenant members can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (
      select tenant_id::text
      from public.memberships
      where user_id = auth.uid()
        and is_active = true
      limit 1
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "voice notes: tenant members can read own files"
  on storage.objects for select
  using (
    bucket_id = 'voice-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (
      select tenant_id::text
      from public.memberships
      where user_id = auth.uid()
        and is_active = true
      limit 1
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "voice notes: tenant members can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'voice-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (
      select tenant_id::text
      from public.memberships
      where user_id = auth.uid()
        and is_active = true
      limit 1
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );
