begin;

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
