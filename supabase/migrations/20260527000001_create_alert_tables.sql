-- ============================================================
-- Alertas de presupuesto por email — 3 tablas nuevas
-- Migración idempotente (safe to run multiple times)
-- ============================================================

-- 1. user_alert_preferences
create table if not exists user_alert_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email_alerts_enabled boolean not null default false,
  threshold_75 boolean not null default true,
  threshold_100 boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_alert_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_alert_preferences'
    and policyname = 'users manage own alert prefs'
  ) then
    create policy "users manage own alert prefs" on user_alert_preferences
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

-- 2. budget_alert_overrides
create table if not exists budget_alert_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_name text not null,
  alerts_enabled boolean not null default false,
  created_at timestamptz default now(),
  unique(user_id, category_name)
);

alter table budget_alert_overrides enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'budget_alert_overrides'
    and policyname = 'users manage own alert overrides'
  ) then
    create policy "users manage own alert overrides" on budget_alert_overrides
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

-- 3. alert_log
create table if not exists alert_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_name text not null,
  month text not null, -- formato YYYY-MM
  threshold text not null check (threshold in ('75', '100')),
  sent_at timestamptz default now(),
  unique(user_id, category_name, month, threshold)
);

alter table alert_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'alert_log'
    and policyname = 'users read own alert log'
  ) then
    create policy "users read own alert log" on alert_log
      for select using (auth.uid() = user_id);
  end if;
end$$;
-- solo service_role puede insertar (desde la Edge Function)
