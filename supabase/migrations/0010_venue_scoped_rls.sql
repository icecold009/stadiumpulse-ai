begin;

create or replace function public.has_venue_access(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  )
  or exists (
    select 1
    from public.user_venue_access
    where user_id = auth.uid()
      and venue_id = target_venue_id
  );
$$;

revoke all on function public.has_venue_access(uuid) from public, anon;
grant execute on function public.has_venue_access(uuid) to authenticated;

drop policy if exists "authenticated users can read venues" on public.venues;
create policy "users can read authorized venues"
on public.venues
for select to authenticated
using (public.has_venue_access(id));

drop policy if exists "authenticated users can read zones" on public.zones;
create policy "users can read authorized zones"
on public.zones
for select to authenticated
using (public.has_venue_access(venue_id));

drop policy if exists "authenticated users can read zone telemetry" on public.zone_telemetry;
create policy "users can read authorized zone telemetry"
on public.zone_telemetry
for select to authenticated
using (
  exists (
    select 1
    from public.zones
    where zones.id = zone_telemetry.zone_id
      and public.has_venue_access(zones.venue_id)
  )
);

drop policy if exists "authenticated users can read gates" on public.gates;
create policy "users can read authorized gates"
on public.gates
for select to authenticated
using (public.has_venue_access(venue_id));

drop policy if exists "authenticated users can read gate scans" on public.gate_scans;
create policy "users can read authorized gate scans"
on public.gate_scans
for select to authenticated
using (
  exists (
    select 1
    from public.gates
    where gates.id = gate_scans.gate_id
      and public.has_venue_access(gates.venue_id)
  )
);

drop policy if exists "authenticated users can read sustainability metrics" on public.sustainability_metrics;
create policy "users can read authorized sustainability metrics"
on public.sustainability_metrics
for select to authenticated
using (public.has_venue_access(venue_id));

drop policy if exists "authenticated users can read alerts" on public.alerts;
create policy "users can read authorized alerts"
on public.alerts
for select to authenticated
using (public.has_venue_access(venue_id));

drop policy if exists "authenticated users can read volunteers" on public.volunteers;
create policy "users can read authorized volunteers"
on public.volunteers
for select to authenticated
using (public.has_venue_access(venue_id));

drop policy if exists "ops and admin can update alerts" on public.alerts;
create policy "ops and admin can update authorized alerts"
on public.alerts
for update to authenticated
using (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('ops_manager', 'admin')
  )
)
with check (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('ops_manager', 'admin')
  )
);

drop policy if exists "volunteer coordinators and admin can update volunteers" on public.volunteers;
create policy "volunteer coordinators and admin can update authorized volunteers"
on public.volunteers
for update to authenticated
using (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('volunteer_coordinator', 'admin')
  )
)
with check (
  public.has_venue_access(venue_id)
  and exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('volunteer_coordinator', 'admin')
  )
);

commit;
