-- ============================================================
-- GymLog — Schema SQL para Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLA: workouts
-- ─────────────────────────────────────────────
create table if not exists workouts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  name        text,
  created_at  timestamptz default now() not null,

  unique(user_id, date)
);

-- Índice para consultas por usuario y fecha
create index if not exists workouts_user_date on workouts(user_id, date desc);

-- RLS: cada usuario solo ve sus propios entrenos
alter table workouts enable row level security;

create policy "Users can manage own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- TABLA: exercises
-- ─────────────────────────────────────────────
create table if not exists exercises (
  id            uuid primary key default uuid_generate_v4(),
  workout_id    uuid not null references workouts(id) on delete cascade,
  name          text not null,
  muscle_group  text,
  created_at    timestamptz default now() not null
);

create index if not exists exercises_workout_id on exercises(workout_id);

-- RLS: acceso a través del workout
alter table exercises enable row level security;

create policy "Users can manage exercises of own workouts"
  on exercises for all
  using (
    exists (
      select 1 from workouts w
      where w.id = exercises.workout_id
      and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts w
      where w.id = exercises.workout_id
      and w.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- TABLA: sets
-- ─────────────────────────────────────────────
create table if not exists sets (
  id            uuid primary key default uuid_generate_v4(),
  exercise_id   uuid not null references exercises(id) on delete cascade,
  reps          integer not null check (reps > 0),
  weight        numeric(6,2) not null check (weight >= 0),
  rir           integer check (rir >= 0 and rir <= 10),
  notes         text,
  created_at    timestamptz default now() not null
);

create index if not exists sets_exercise_id on sets(exercise_id);

-- RLS: acceso a través del ejercicio → workout
alter table sets enable row level security;

create policy "Users can manage sets of own exercises"
  on sets for all
  using (
    exists (
      select 1 from exercises e
      join workouts w on w.id = e.workout_id
      where e.id = sets.exercise_id
      and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from exercises e
      join workouts w on w.id = e.workout_id
      where e.id = sets.exercise_id
      and w.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- VISTA ÚTIL: historial por ejercicio (opcional)
-- ─────────────────────────────────────────────
create or replace view exercise_history as
  select
    w.user_id,
    w.date,
    e.name as exercise_name,
    e.muscle_group,
    s.reps,
    s.weight,
    s.rir,
    s.notes,
    s.created_at as set_created_at
  from sets s
  join exercises e on e.id = s.exercise_id
  join workouts w on w.id = e.workout_id;

-- ─────────────────────────────────────────────
-- FIN DEL SCHEMA
-- ─────────────────────────────────────────────
