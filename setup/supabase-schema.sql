create table if not exists public.ktf_progress_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('exam_attempt','settings','custom_upsert','custom_delete','custom_review')),
  payload jsonb not null,
  client_time timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists ktf_progress_events_user_time_idx
  on public.ktf_progress_events (user_id, client_time desc);

alter table public.ktf_progress_events enable row level security;

revoke all on public.ktf_progress_events from anon, authenticated;
grant select, insert on public.ktf_progress_events to authenticated;

drop policy if exists "ktf_events_read_own" on public.ktf_progress_events;
create policy "ktf_events_read_own"
  on public.ktf_progress_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ktf_events_insert_own" on public.ktf_progress_events;
create policy "ktf_events_insert_own"
  on public.ktf_progress_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
