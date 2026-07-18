begin;

create table if not exists public.user_venue_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  primary key (user_id, venue_id)
);

create index if not exists user_venue_access_venue_id_idx
on public.user_venue_access (venue_id);

-- Preserve the existing demo's organization-wide visibility while making
-- non-admin venue scope explicit. Administrators remain cross-venue by role.
insert into public.user_venue_access (user_id, venue_id)
select roles.user_id, venues.id
from public.user_roles as roles
cross join public.venues as venues
where roles.role <> 'admin'
on conflict (user_id, venue_id) do nothing;

alter table public.user_venue_access enable row level security;
revoke all on table public.user_venue_access from anon;
revoke insert, update, delete on table public.user_venue_access from authenticated;
grant select on table public.user_venue_access to authenticated;

drop policy if exists "users can read their own venue access"
on public.user_venue_access;
create policy "users can read their own venue access"
on public.user_venue_access for select to authenticated
using (auth.uid() = user_id);

commit;
