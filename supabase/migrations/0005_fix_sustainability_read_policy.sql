begin;

alter table public.sustainability_metrics enable row level security;
grant select on table public.sustainability_metrics to authenticated;

-- Restore the product's org-wide read model. A live-project policy drifted to
-- admin-only visibility, which made the Sustainability Lead page appear empty.
drop policy if exists "authenticated users can read sustainability metrics"
on public.sustainability_metrics;

create policy "authenticated users can read sustainability metrics"
on public.sustainability_metrics
for select
to authenticated
using (true);

commit;
