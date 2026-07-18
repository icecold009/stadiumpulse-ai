begin;

alter table public.alerts
  add column if not exists ai_urgency text not null default 'monitor',
  add column if not exists ai_evidence text not null default '',
  add column if not exists ai_limitations text not null default 'Recommendation generated from the available snapshot only.',
  add column if not exists ai_confidence text not null default 'medium',
  add column if not exists recommendation_source text not null default 'fallback',
  add column if not exists snapshot_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'alerts_ai_urgency_check'
      and conrelid = 'public.alerts'::regclass
  ) then
    alter table public.alerts add constraint alerts_ai_urgency_check
      check (ai_urgency in ('monitor', 'prompt', 'immediate'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alerts_ai_confidence_check'
      and conrelid = 'public.alerts'::regclass
  ) then
    alter table public.alerts add constraint alerts_ai_confidence_check
      check (ai_confidence in ('low', 'medium', 'high'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'alerts_recommendation_source_check'
      and conrelid = 'public.alerts'::regclass
  ) then
    alter table public.alerts add constraint alerts_recommendation_source_check
      check (recommendation_source in ('ai', 'fallback'));
  end if;
end
$$;

create table if not exists public.rate_limits (
  subject text not null,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (subject, action, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_subject text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz;
  updated_count integer;
begin
  if p_subject = '' or p_action = '' or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit arguments';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (subject, action, window_start, request_count)
  values (p_subject, p_action, current_window, 1)
  on conflict (subject, action, window_start) do update
    set request_count = public.rate_limits.request_count + 1
    where public.rate_limits.request_count < p_limit
  returning request_count into updated_count;

  return updated_count is not null;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
to service_role;

create index if not exists rate_limits_window_start_idx
on public.rate_limits (window_start);

commit;
