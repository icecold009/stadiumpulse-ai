begin;

-- Older hosted revisions used several policy names that are not present in
-- the numbered source migrations. Remove those aliases explicitly so they
-- cannot OR together with the venue-scoped policies from 0010.
drop policy if exists "authenticated can read alerts" on public.alerts;
drop policy if exists "authenticated users can read alerts" on public.alerts;
drop policy if exists "ops_manager + admin can read alerts" on public.alerts;
drop policy if exists "ops_manager + admin can update alerts" on public.alerts;
drop policy if exists "ops and admin can update alerts" on public.alerts;

drop policy if exists "authenticated users can read zone telemetry" on public.zone_telemetry;
drop policy if exists "ops_manager + admin can read zone telemetry" on public.zone_telemetry;

drop policy if exists "authenticated users can read gate scans" on public.gate_scans;
drop policy if exists "ops_manager + admin can read gate scans" on public.gate_scans;

drop policy if exists "authenticated users can read sustainability metrics" on public.sustainability_metrics;
drop policy if exists "ops_manager + admin can read sustainability metrics" on public.sustainability_metrics;

drop policy if exists "authenticated users can read volunteers" on public.volunteers;
drop policy if exists "volunteer_coordinator + admin can read volunteers" on public.volunteers;
drop policy if exists "volunteer_coordinator + admin can insert volunteers" on public.volunteers;
drop policy if exists "volunteer_coordinator + admin can delete volunteers" on public.volunteers;
drop policy if exists "volunteer coordinators and admin can update volunteers" on public.volunteers;

drop policy if exists "authenticated users can read venues" on public.venues;
drop policy if exists "authenticated users can read zones" on public.zones;
drop policy if exists "authenticated users can read gates" on public.gates;

-- This helper is a server-maintenance utility. It is not an end-user RPC and
-- must not be callable by anon/authenticated clients.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
grant execute on function public.rls_auto_enable() to service_role;

commit;
