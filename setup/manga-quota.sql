create table if not exists public.ktf_manga_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  requests integer not null default 0,
  primary key (user_id, day)
);

alter table public.ktf_manga_daily_usage enable row level security;
revoke all on public.ktf_manga_daily_usage from anon, authenticated;

create or replace function public.consume_ktf_manga_quota()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.ktf_manga_daily_usage (user_id, day, requests)
  values (auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day)
  do update set requests = ktf_manga_daily_usage.requests + 1
  where public.ktf_manga_daily_usage.requests < 30
  returning requests into used;

  if used is null then
    raise exception 'Daily limit reached';
  end if;
  return used;
end;
$$;

revoke all on function public.consume_ktf_manga_quota() from public, anon;
grant execute on function public.consume_ktf_manga_quota() to authenticated;
