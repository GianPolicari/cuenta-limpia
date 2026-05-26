-- Plantillas de transacciones recurrentes
create table if not exists public.recurring_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    description text not null,
    amount numeric not null check (amount > 0),
    category text,
    transaction_type text not null check (transaction_type in ('income', 'expense')),
    card_id uuid references public.cards(id) on delete set null,
    day_of_month integer not null check (day_of_month between 1 and 28),
    is_active boolean default true not null,
    created_at timestamptz default now()
);
alter table public.recurring_transactions enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'recurring_transactions' and policyname = 'Users manage own recurring'
  ) then
    create policy "Users manage own recurring" on public.recurring_transactions
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Registro de qué mes/año ya fue aplicado cada recurrente
create table if not exists public.recurring_applied (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    recurring_id uuid references public.recurring_transactions(id) on delete cascade not null,
    applied_month integer not null,
    applied_year integer not null,
    transaction_id uuid references public.transactions(id) on delete set null,
    unique(recurring_id, applied_month, applied_year)
);
alter table public.recurring_applied enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'recurring_applied' and policyname = 'Users manage own recurring_applied'
  ) then
    create policy "Users manage own recurring_applied" on public.recurring_applied
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
