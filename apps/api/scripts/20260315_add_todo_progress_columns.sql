-- Add cumulative todo progress counters used by mission score logic.
-- Run this once in Supabase SQL editor.

alter table if exists public.profiles
  add column if not exists todo_created_count integer not null default 0,
  add column if not exists todo_completed_count integer not null default 0;

comment on column public.profiles.todo_created_count is
  'Lifetime number of todos created by the user. Never decremented.';

comment on column public.profiles.todo_completed_count is
  'Lifetime number of todos completed by the user. Never decremented even when todos are deleted.';
