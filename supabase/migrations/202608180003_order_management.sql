create sequence if not exists public.applications_order_number_seq start with 1001;
alter table public.applications add column if not exists order_number bigint;
alter table public.applications alter column order_number set default nextval('public.applications_order_number_seq');
update public.applications set order_number = nextval('public.applications_order_number_seq') where order_number is null;
alter table public.applications alter column order_number set not null;
create unique index if not exists applications_order_number_unique on public.applications(order_number);
select setval('public.applications_order_number_seq', greatest((select coalesce(max(order_number), 1000) from public.applications), 1000), true);

create policy "Authenticated users can delete applications"
on public.applications for delete
to authenticated
using (true);
