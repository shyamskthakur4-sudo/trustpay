create extension if not exists pgcrypto;

create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  verifier_hash text not null unique,
  created_at timestamptz not null default now(),
  locked_at timestamptz
);

create table if not exists public.wallet_addresses (
  id uuid primary key default gen_random_uuid(),
  network text not null unique,
  standard text not null,
  ticker text not null,
  address text not null,
  qr_path text,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.wallet_addresses(network,standard,ticker,address) values
('BNB Smart Chain','BEP-20','BNB','0xdc114586391B39216c8CD17B3bdDb02dF3CC5F0A'),
('TRON','TRC-20','TRX','TMVhrv1qfySpPfsuUghb19TuZvjzXukD9K'),
('Arbitrum','Arbitrum One','ETH','0xdc114586391B39216c8CD17B3bdDb02dF3CC5F0A'),
('Bitcoin','BTC','BTC','bc1qxny7h6hpkuw47sgmqn228m46k2zmvhexpcns0h'),
('Solana','SPL','SOL','7rV7Bkz4sjxYDZmhCQPR6WpueXYnZYw35NUFkj6mfGde')
on conflict(network) do update set standard=excluded.standard,ticker=excluded.ticker,address=excluded.address,updated_at=now();

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wallet_accounts(id),
  network text not null,
  amount_usdt numeric(30,6) not null check (amount_usdt >= 500),
  tx_hash text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected','needs_review')),
  confirmations integer not null default 0,
  verified_amount_usdt numeric(30,6),
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(network,tx_hash)
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wallet_accounts(id),
  amount_usdt numeric(30,6) not null check (amount_usdt >= 500),
  rate_inr numeric(18,2) not null default 107,
  amount_inr numeric(30,2) generated always as (amount_usdt * rate_inr) stored,
  method text not null check (method in ('UPI','IMPS')),
  payout_details_encrypted text not null,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  approved_by uuid references auth.users(id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.wallet_accounts enable row level security;
alter table public.wallet_addresses enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;

create policy "admins read wallet addresses" on public.wallet_addresses for select to authenticated using (public.is_admin() or active=true);
create policy "admins write wallet addresses" on public.wallet_addresses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read deposits" on public.deposits for select to authenticated using (public.is_admin());
create policy "admins update deposits" on public.deposits for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read withdrawals" on public.withdrawals for select to authenticated using (public.is_admin());
create policy "admins update withdrawals" on public.withdrawals for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.is_admin());

insert into storage.buckets(id,name,public) values ('wallet-qr','wallet-qr',false) on conflict(id) do nothing;

create policy "admins manage wallet qr" on storage.objects for all to authenticated using (bucket_id='wallet-qr' and public.is_admin()) with check (bucket_id='wallet-qr' and public.is_admin());

comment on table public.wallet_accounts is 'Stores only a one-way wallet verifier; never store recovery phrases.';
comment on table public.deposits is 'Deposits are pending until independently verified on-chain.';
