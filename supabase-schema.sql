create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric(12, 2) not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can read their own transactions" on public.transactions;
drop policy if exists "Users can insert their own transactions" on public.transactions;
drop policy if exists "Users can update their own transactions" on public.transactions;
drop policy if exists "Users can delete their own transactions" on public.transactions;

create policy "Users can read their own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.portfolios enable row level security;

drop policy if exists "Users can read their own portfolios" on public.portfolios;
drop policy if exists "Users can insert their own portfolios" on public.portfolios;
drop policy if exists "Users can update their own portfolios" on public.portfolios;
drop policy if exists "Users can delete their own portfolios" on public.portfolios;

create policy "Users can read their own portfolios"
on public.portfolios
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own portfolios"
on public.portfolios
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own portfolios"
on public.portfolios
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own portfolios"
on public.portfolios
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  name text,
  purchase_date date not null,
  quantity numeric(18, 6) not null check (quantity > 0),
  purchase_price numeric(18, 6) not null check (purchase_price >= 0),
  current_price numeric(18, 6),
  price_date text,
  created_at timestamptz not null default now()
);

alter table public.portfolio_positions enable row level security;

drop policy if exists "Users can read their own positions" on public.portfolio_positions;
drop policy if exists "Users can insert their own positions" on public.portfolio_positions;
drop policy if exists "Users can update their own positions" on public.portfolio_positions;
drop policy if exists "Users can delete their own positions" on public.portfolio_positions;

create policy "Users can read their own positions"
on public.portfolio_positions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own positions"
on public.portfolio_positions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.portfolios
    where portfolios.id = portfolio_positions.portfolio_id
      and portfolios.user_id = auth.uid()
  )
);

create policy "Users can update their own positions"
on public.portfolio_positions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own positions"
on public.portfolio_positions
for delete
to authenticated
using (auth.uid() = user_id);
