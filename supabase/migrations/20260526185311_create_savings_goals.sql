create table if not exists public.savings_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    target_amount numeric not null check (target_amount > 0),
    current_amount numeric not null default 0 check (current_amount >= 0),
    deadline date,
    created_at timestamptz default now()
);
alter table public.savings_goals enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'savings_goals'
          and policyname = 'Users manage own savings_goals'
    ) then
        create policy "Users manage own savings_goals" on public.savings_goals
            for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;
end
$$;