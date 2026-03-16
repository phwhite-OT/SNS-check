-- Add per-user hourly wage setting used by analysis calculations.
-- Run this once in Supabase SQL editor.

alter table if exists public.profiles
  add column if not exists hourly_wage_jpy integer;

comment on column public.profiles.hourly_wage_jpy is
  'User-specific hourly wage in JPY used for waste/loss calculations.';
