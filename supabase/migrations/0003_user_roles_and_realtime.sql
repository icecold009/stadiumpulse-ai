begin;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_roles_role_check'
      and conrelid = 'public.user_roles'::regclass
  ) then
    alter table public.user_roles
      add constraint user_roles_role_check
      check (role in ('admin', 'ops_manager', 'sustainability_lead', 'volunteer_coordinator'));
  end if;
end
$$;

-- One-time migration path for demo accounts that previously stored roles in
-- editable user metadata. Runtime authorization no longer reads that field.
insert into public.user_roles (user_id, role)
select id, raw_user_meta_data ->> 'role'
from auth.users
where raw_user_meta_data ->> 'role' in (
  'admin', 'ops_manager', 'sustainability_lead', 'volunteer_coordinator'
)
on conflict (user_id) do nothing;

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from anon;
revoke insert, update, delete on table public.user_roles from authenticated;
grant select on table public.user_roles to authenticated;

drop policy if exists "users can read their own role" on public.user_roles;
create policy "users can read their own role"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "ops and admin can update alerts" on public.alerts;
create policy "ops and admin can update alerts"
on public.alerts for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('ops_manager', 'admin')
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('ops_manager', 'admin')
  )
);

drop policy if exists "volunteer coordinators and admin can update volunteers"
on public.volunteers;
create policy "volunteer coordinators and admin can update volunteers"
on public.volunteers for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('volunteer_coordinator', 'admin')
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('volunteer_coordinator', 'admin')
  )
);

-- Hosted Supabase projects create this publication. Guard it so other
-- Postgres environments can still apply the migration.
do $$
declare
  realtime_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach realtime_table in array array[
      'zone_telemetry', 'gate_scans', 'sustainability_metrics', 'alerts', 'volunteers'
    ]
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = realtime_table
      ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          realtime_table
        );
      end if;
    end loop;
  end if;
end
$$;

commit;
