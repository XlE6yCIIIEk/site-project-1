alter table public.applications
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists privacy_consent_version text;

update public.applications
set privacy_consent_at = coalesce(privacy_consent_at, created_at),
    privacy_consent_version = coalesce(privacy_consent_version, 'before-consent-v1')
where privacy_consent_at is null or privacy_consent_version is null;

alter table public.applications
  alter column privacy_consent_at set not null,
  alter column privacy_consent_version set not null;
