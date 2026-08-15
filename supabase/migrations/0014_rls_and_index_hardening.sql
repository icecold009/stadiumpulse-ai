begin;

-- Cover every foreign key that participates in dashboard joins, RLS checks,
-- or operator decision history.
create index if not exists alerts_decision_by_idx
on public.alerts (decision_by);

create index if not exists alerts_handled_by_idx
on public.alerts (handled_by);

create index if not exists alerts_venue_id_idx
on public.alerts (venue_id);

create index if not exists gate_scans_gate_id_idx
on public.gate_scans (gate_id);

create index if not exists gates_venue_id_idx
on public.gates (venue_id);

create index if not exists sustainability_metrics_venue_id_idx
on public.sustainability_metrics (venue_id);

create index if not exists telemetry_rollups_gate_id_idx
on public.telemetry_rollups (gate_id);

create index if not exists telemetry_rollups_zone_id_idx
on public.telemetry_rollups (zone_id);

create index if not exists volunteers_venue_id_idx
on public.volunteers (venue_id);

create index if not exists zone_telemetry_zone_id_idx
on public.zone_telemetry (zone_id);

create index if not exists zones_venue_id_idx
on public.zones (venue_id);

-- Remove the redundant permissive false policy. RLS remains enabled and the
-- positive policy below is the only authenticated SELECT path.
drop policy if exists "No user select" on public.user_roles;

drop policy if exists "users can view their own copilot queries" on public.copilot_queries;
create policy "users can view their own copilot queries"
on public.copilot_queries
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own copilot queries" on public.copilot_queries;
create policy "users can insert own copilot queries"
on public.copilot_queries
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users can read their own role" on public.user_roles;
create policy "users can read their own role"
on public.user_roles
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can read their own venue access" on public.user_venue_access;
create policy "users can read their own venue access"
on public.user_venue_access
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ops and admin can update authorized alerts" on public.alerts;
create policy "ops and admin can update authorized alerts"
on public.alerts
for update to authenticated
using (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('ops_manager', 'admin')
  )
)
with check (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('ops_manager', 'admin')
  )
);

drop policy if exists "volunteer coordinators and admin can update authorized volunteers" on public.volunteers;
create policy "volunteer coordinators and admin can update authorized volunteers"
on public.volunteers
for update to authenticated
using (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('volunteer_coordinator', 'admin')
  )
)
with check (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('volunteer_coordinator', 'admin')
  )
);

-- Keep the helper's own auth lookup init-plan safe when PostgreSQL inlines the
-- stable SQL function into a venue-scoped policy.
create or replace function public.has_venue_access(target_venue_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  )
  or exists (
    select 1
    from public.user_venue_access
    where user_id = (select auth.uid())
      and venue_id = target_venue_id
  );
$$;

revoke all on function public.has_venue_access(uuid) from public, anon;
grant execute on function public.has_venue_access(uuid) to authenticated;

commit;
