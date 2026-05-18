alter table public.workspaces
  add column if not exists industry text,
  add column if not exists team_size text,
  add column if not exists operating_mode text;
