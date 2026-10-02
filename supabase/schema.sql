-- Supabase schema for the Mariam Market storefront
-- Run this SQL in the SQL editor of your real Supabase project.

create extension if not exists pgcrypto;

do $$ begin
  create type public.order_status as enum (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded'
  );
exception when duplicate_object then null;
end $$;

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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  roles text[] not null default array['Sales Staff']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  name text not null,
  email text,
  phone text,
  address text,
  company_name text,
  customer_type text not null default 'INDIVIDUAL',
  notes text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists selling_price numeric(12,2) not null default 0,
  add column if not exists cost_price numeric(12,2) not null default 0,
  add column if not exists min_stock_level integer not null default 0,
  add column if not exists unit text not null default 'unit',
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists slug text,
  add column if not exists short_description text,
  add column if not exists rating numeric(2,1) not null default 0,
  add column if not exists reviews integer not null default 0,
  add column if not exists old_price numeric(12,2),
  add column if not exists badge text,
  add column if not exists specs jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists subtotal numeric(12,2) not null default 0,
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists total numeric(12,2) not null default 0,
  add column if not exists notes text;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'ISSUED',
  due_date timestamptz,
  total numeric(12,2) not null check (total >= 0),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'PENDING',
  provider text not null default 'paystack',
  reference text unique,
  provider_ref text,
  webhook_event text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null,
  quantity integer not null check (quantity > 0),
  reason text,
  reference text,
  created_at timestamptz not null default now()
);

create or replace function public.adjust_inventory_stock(
  p_product_id uuid,
  p_quantity integer,
  p_type text,
  p_reason text,
  p_reference text
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  target_product public.products%rowtype;
  saved_transaction public.inventory_transactions%rowtype;
  updated_quantity integer;
begin
  if p_quantity <= 0 or p_type not in ('IN', 'OUT', 'ADJUSTMENT') then
    raise exception 'Invalid inventory adjustment.' using errcode = '22023';
  end if;

  select * into target_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.' using errcode = 'P0002';
  end if;

  if p_type = 'OUT' and target_product.stock_quantity < p_quantity then
    raise exception 'Insufficient stock.' using errcode = '23514';
  end if;

  updated_quantity = case
    when p_type = 'OUT' then target_product.stock_quantity - p_quantity
    else target_product.stock_quantity + p_quantity
  end;

  update public.products
  set stock_quantity = updated_quantity
  where id = p_product_id
  returning * into target_product;

  insert into public.inventory_transactions (product_id, type, quantity, reason, reference)
  values (p_product_id, p_type, p_quantity, p_reason, p_reference)
  returning * into saved_transaction;

  return jsonb_build_object(
    'product', to_jsonb(target_product),
    'transaction', to_jsonb(saved_transaction)
  );
end;
$$;

revoke all on function public.adjust_inventory_stock(uuid, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.adjust_inventory_stock(uuid, integer, text, text, text) to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists idx_products_active_created_at
  on public.products (is_active, created_at desc);

create index if not exists idx_products_category
  on public.products (category);
create unique index if not exists idx_products_slug
  on public.products (slug) where slug is not null;

create index if not exists idx_orders_user_created_at
  on public.orders (user_id, created_at desc);

create index if not exists idx_orders_status
  on public.orders (status);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

create index if not exists idx_order_items_product_id
  on public.order_items (product_id);
create index if not exists idx_customers_created_at
  on public.customers (created_at desc);
create index if not exists idx_invoices_issued_at
  on public.invoices (issued_at desc);
create index if not exists idx_payments_created_at
  on public.payments (created_at desc);
create index if not exists idx_inventory_transactions_created_at
  on public.inventory_transactions (created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_transactions enable row level security;

drop policy if exists "Public can view active products" on public.products;
drop policy if exists "Service role can manage products" on public.products;
drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Users can insert their own orders" on public.orders;
drop policy if exists "Users can update their own orders" on public.orders;
drop policy if exists "Service role can manage orders" on public.orders;
drop policy if exists "Users can view their own order items" on public.order_items;
drop policy if exists "Users can insert their own order items" on public.order_items;
drop policy if exists "Users can update their own order items" on public.order_items;
drop policy if exists "Service role can manage order items" on public.order_items;

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

insert into public.products as current_product (
  sku, name, description, category, price, image_url, stock_quantity, is_active,
  selling_price, cost_price, min_stock_level, unit, status, slug, short_description,
  rating, reviews, old_price, badge, specs
)
values
  ('MARIAM-RICE-001', 'Mariam Market Rice 25kg', 'A premium rice choice for homes and everyday family meals.', 'Rice & Grains', 42000, 'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80', 120, true, 42000, 32000, 10, 'bag', 'ACTIVE', 'mariam-market-rice-25kg', 'Premium long-grain rice for family meals and everyday cooking.', 4.8, 312, 47000, 'Top seller', '[{"label":"Pack size","value":"25kg"},{"label":"Type","value":"Long grain"},{"label":"Origin","value":"Nigeria"},{"label":"Storage","value":"Cool dry place"}]'),
  ('MARIAM-OIL-002', 'Golden Palm Oil 4L', 'A household favorite for preparing traditional dishes and stews.', 'Kitchen Staples', 18500, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80', 80, true, 18500, 14000, 8, 'bottle', 'ACTIVE', 'golden-palm-oil-4l', 'Cold-pressed palm oil ideal for soups, sauces, and stews.', 4.7, 204, 21500, 'Fresh stock', '[{"label":"Volume","value":"4 litres"},{"label":"Type","value":"Refined"},{"label":"Use","value":"Cooking"},{"label":"Packaging","value":"Sealed bottle"}]'),
  ('MARIAM-SPICE-003', 'Local Spice Bundle', 'A carefully balanced blend of local seasonings.', 'Spices & Seasonings', 9500, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', 95, true, 9500, 7000, 8, 'bundle', 'ACTIVE', 'local-spice-bundle', 'A balanced mix of essential seasonings for authentic home cooking.', 4.9, 421, 11500, 'Best value', '[{"label":"Contents","value":"6 spice items"},{"label":"Flavour","value":"Classic local"},{"label":"Suitability","value":"Home cooking"},{"label":"Packaging","value":"Gift-ready set"}]'),
  ('MARIAM-SOAP-004', 'Family Soap Pack', 'Dependable household soap for regular family use.', 'Household Care', 6000, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80', 70, true, 6000, 4200, 12, 'pack', 'ACTIVE', 'family-soap-pack', 'Everyday hygiene essentials for the whole household.', 4.6, 196, 7600, 'Daily essential', '[{"label":"Count","value":"8 bars"},{"label":"Skin type","value":"All families"},{"label":"Use","value":"Bath & cleaning"},{"label":"Finish","value":"Gentle fragrance"}]')
on conflict (sku) do update set
  selling_price = case when current_product.selling_price = 0 then excluded.selling_price else current_product.selling_price end,
  cost_price = case when current_product.cost_price = 0 then excluded.cost_price else current_product.cost_price end,
  min_stock_level = case when current_product.min_stock_level = 0 then excluded.min_stock_level else current_product.min_stock_level end,
  unit = case when current_product.unit = 'unit' then excluded.unit else current_product.unit end,
  slug = coalesce(current_product.slug, excluded.slug),
  short_description = coalesce(current_product.short_description, excluded.short_description),
  rating = case when current_product.rating = 0 then excluded.rating else current_product.rating end,
  reviews = case when current_product.reviews = 0 then excluded.reviews else current_product.reviews end,
  old_price = coalesce(current_product.old_price, excluded.old_price),
  badge = coalesce(current_product.badge, excluded.badge),
  specs = case when current_product.specs = '[]'::jsonb then excluded.specs else current_product.specs end;
