begin;

alter table public.alerts
  add column if not exists operator_decision text,
  add column if not exists decision_by uuid references auth.users(id) on delete set null,
  add column if not exists decision_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'alerts_operator_decision_check'
      and conrelid = 'public.alerts'::regclass
  ) then
    alter table public.alerts add constraint alerts_operator_decision_check
      check (operator_decision in ('accepted', 'rejected'));
  end if;
end
$$;

commit;
