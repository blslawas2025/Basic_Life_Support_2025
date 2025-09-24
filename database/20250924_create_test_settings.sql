-- Create table to store global test settings
create table if not exists public.test_settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null unique, -- e.g., 'global' or per course/session in future
  settings jsonb not null,
  updated_at timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table public.test_settings enable row level security;

-- Allow read to anon, write to authenticated by default policies (adjust as needed)
do $$ begin
  create policy "test_settings_read" on public.test_settings
    for select
    to anon
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "test_settings_upsert" on public.test_settings
    for insert
    to authenticated
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "test_settings_update" on public.test_settings
    for update
    to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;


