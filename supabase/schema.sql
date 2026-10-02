-- Supabase schema for the Mariam Market storefront
-- Run this SQL in the SQL editor of your real Supabase project.

create extension if not exists pgcrypto;

create type public.order_status as enum (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded'
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  description text,
  category text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_address text,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid null references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_active_created_at
  on public.products (is_active, created_at desc);

create index if not exists idx_products_category
  on public.products (category);

create index if not exists idx_orders_user_created_at
  on public.orders (user_id, created_at desc);

create index if not exists idx_orders_status
  on public.orders (status);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

create index if not exists idx_order_items_product_id
  on public.order_items (product_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger trg_orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "Service role can manage products"
on public.products
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Users can view their own orders"
on public.orders
for select
using (auth.uid() = user_id);

create policy "Users can insert their own orders"
on public.orders
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own orders"
on public.orders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Service role can manage orders"
on public.orders
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Users can view their own order items"
on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Users can insert their own order items"
on public.order_items
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Users can update their own order items"
on public.order_items
for update
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Service role can manage order items"
on public.order_items
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.products (sku, name, description, category, price, image_url, stock_quantity, is_active)
values
  ('MARIAM-RICE-001', 'Mariam Market Rice Bag', 'Premium rice for daily household meals.', 'Essentials', 42000, 'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80', 120, true),
  ('MARIAM-OIL-002', 'Fresh Palm Oil', 'Natural palm oil for everyday cooking.', 'Kitchen', 18500, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80', 80, true),
  ('MARIAM-SPICE-003', 'Local Spices Bundle', 'A balanced blend of authentic market spices.', 'Seasoning', 9500, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', 95, true),
  ('MARIAM-SOAP-004', 'Family Soap Pack', 'Household cleaning essentials for busy homes.', 'Household', 6000, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80', 70, true)
on conflict (sku) do nothing;
