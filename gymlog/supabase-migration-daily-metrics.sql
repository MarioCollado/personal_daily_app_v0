-- ============================================================
-- GymLog — Migración: daily_metrics
-- Ejecuta esto en el SQL Editor de Supabase (además del schema base)
-- ============================================================

create table if not exists daily_metrics (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  date                date not null,

  -- Sueño
  sleep_hours         numeric(4,1) check (sleep_hours >= 0 and sleep_hours <= 24),

  -- Estado mental
  energy              smallint check (energy >= 1 and energy <= 5),
  stress              smallint check (stress >= 1 and stress <= 5),
  motivation          smallint check (motivation >= 1 and motivation <= 5),

  -- Lectura
  book_title          text,
  pages_read          integer check (pages_read >= 0),
  book_total_pages    integer check (book_total_pages > 0),

  -- Clima (cacheado del fetch en frontend)
  weather_temp        numeric(5,1),
  weather_condition   text,

  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null,

  unique(user_id, date)
);

create index if not exists daily_metrics_user_date on daily_metrics(user_id, date desc);

alter table daily_metrics enable row level security;

create policy "Users can manage own daily metrics"
  on daily_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger para auto-actualizar updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_metrics_updated_at
  before update on daily_metrics
  for each row execute function update_updated_at();
