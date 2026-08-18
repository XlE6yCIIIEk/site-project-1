drop policy if exists "Visitors can create applications" on public.applications;

create table if not exists public.application_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);
alter table public.application_rate_limits enable row level security;

create or replace function public.consume_application_rate_limit(p_bucket text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare allowed boolean;
begin
  insert into public.application_rate_limits (bucket, window_started_at, request_count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    window_started_at = case when application_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now() else application_rate_limits.window_started_at end,
    request_count = case when application_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1 else application_rate_limits.request_count + 1 end
  returning request_count <= p_max into allowed;
  return allowed;
end;
$$;
revoke all on function public.consume_application_rate_limit(text, integer, integer) from public;
