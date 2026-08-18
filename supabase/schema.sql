-- Run this script in Supabase Dashboard → SQL Editor.
create extension if not exists pgcrypto;
create sequence if not exists public.applications_order_number_seq start with 1001;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique default nextval('public.applications_order_number_seq'),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  from_address text not null,
  to_address text not null,
  moving_date date not null,
  volume text,
  comment text,
  privacy_consent_at timestamptz not null default now(),
  privacy_consent_version text not null default 'privacy-v1',
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'completed', 'cancelled'))
);

alter table public.applications enable row level security;

-- Visitors may create an application but can never read or alter one.
create policy "Visitors can create applications"
on public.applications for insert
to anon
with check (status = 'new');

-- Authenticated Supabase users are administrators for this small internal app.
create policy "Authenticated users can read applications"
on public.applications for select
to authenticated
using (true);

create policy "Authenticated users can update applications"
on public.applications for update
to authenticated
using (true)
with check (status in ('new', 'contacted', 'in_progress', 'completed', 'cancelled'));
