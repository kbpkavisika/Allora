-- Buyer/seller role chosen during onboarding. Null until the role-select step completes.

alter table public.profiles
  add column role text check (role in ('user', 'seller'));

-- Accessibility preferences chosen on the personalize onboarding step.

alter table public.profiles
  add column large_text boolean not null default false,
  add column high_contrast boolean not null default false,
  add column dictation_enabled boolean not null default false,
  add column screen_reader_support boolean not null default false,
  add column reduce_motion boolean not null default false;
