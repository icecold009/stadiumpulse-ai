begin;

-- The helper only reads the caller's own role and venue assignments. Running
-- as the invoker preserves those existing RLS boundaries and avoids exposing
-- a SECURITY DEFINER RPC in the public schema.
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

commit;
