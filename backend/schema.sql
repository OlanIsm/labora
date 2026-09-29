-- Run this in the Supabase SQL editor after creating a project.
create table if not exists public.assignments (
  id text primary key,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_name text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.experiment_results (
  student_id uuid not null references auth.users(id) on delete cascade,
  experiment_id text not null,
  class_name text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (student_id, experiment_id)
);
alter table public.assignments enable row level security;
alter table public.experiment_results enable row level security;
create policy "Teachers manage own assignments" on public.assignments for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and auth.jwt()->'user_metadata'->>'role' = 'teacher');
create policy "Students read class assignments" on public.assignments for select to authenticated
  using (class_name = auth.jwt()->'user_metadata'->>'className');
create policy "Students manage own results" on public.experiment_results for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid() and class_name = auth.jwt()->'user_metadata'->>'className');
create policy "Teachers read assigned class results" on public.experiment_results for select to authenticated
  using (auth.jwt()->'user_metadata'->>'role' = 'teacher' and exists (
    select 1 from public.assignments a where a.teacher_id = auth.uid() and a.class_name = experiment_results.class_name
  ));
