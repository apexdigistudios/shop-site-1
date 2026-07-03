-- ADOB'S IMPORTS HUB — Supabase schema
-- Run this in the Supabase SQL editor. Also create a public storage bucket named "images".

create extension if not exists "uuid-ossp";

-- USERS ---------------------------------------------------------------
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- CATEGORIES ---------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image text,
  created_at timestamptz not null default now()
);

-- PRODUCTS ---------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  long_description text,
  price numeric not null default 0,
  compare_price numeric,
  images text[] default '{}',
  sizes text[] default '{}',
  colors jsonb default '[]',
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','out_of_stock','preorder')),
  featured boolean not null default false,
  new_arrival boolean not null default false,
  sku text,
  category_id uuid references categories(id) on delete set null,
  visibility boolean not null default true,
  created_at timestamptz not null default now()
);

-- ORDERS ---------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  items jsonb not null default '[]',
  total numeric not null default 0,
  total_amount numeric not null default 0,
  deposit_amount numeric not null default 0,
  remaining_balance numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','pending_payment','processing','shipped','delivered','cancelled')),
  payment_method text not null default 'meetup' check (payment_method in ('paystack_deposit','meetup')),
  payment_status text not null default 'pending_meetup_payment' check (payment_status in ('deposit_paid','pending_meetup_payment')),
  meetup_status text not null default 'awaiting_meetup' check (meetup_status in ('awaiting_meetup','arranged','completed','cancelled')),
  customer_name text,
  customer_phone text,
  customer_address text,
  created_at timestamptz not null default now()
);

alter table orders add column if not exists total_amount numeric not null default 0;
alter table orders add column if not exists deposit_amount numeric not null default 0;
alter table orders add column if not exists remaining_balance numeric not null default 0;
alter table orders add column if not exists meetup_status text not null default 'awaiting_meetup';

-- CART ---------------------------------------------------------------
create table if not exists cart (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity int not null default 1,
  size text,
  color text
);

-- WISHLIST ---------------------------------------------------------------
create table if not exists wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade
);

-- REVIEWS ---------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  reviewer_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- COUPONS ---------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  discount numeric not null default 0,
  active boolean not null default true
);

-- TESTIMONIALS ---------------------------------------------------------------
create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  message text not null,
  image text
);

-- HOME TEXT ---------------------------------------------------------------
create table if not exists home_text (
  id uuid primary key default uuid_generate_v4(),
  hero_title text not null default 'ADOB''S IMPORTS HUB',
  hero_subtitle text not null default 'Curated luxury imports, delivered with editorial precision.',
  about_text text not null default 'We source the finest imported pieces for the modern connoisseur.',
  logo_url text,
  paystack_enabled boolean not null default false
);

-- Migration for existing databases:
alter table home_text add column if not exists logo_url text;
alter table home_text add column if not exists paystack_enabled boolean not null default false;

insert into home_text (hero_title, hero_subtitle, about_text)
select 'ADOB''S IMPORTS HUB', 'Curated luxury imports, delivered with editorial precision.', 'We source the finest imported pieces for the modern connoisseur.'
where not exists (select 1 from home_text);

-- ROW LEVEL SECURITY -------------------------------------------------------
alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table cart enable row level security;
alter table wishlist enable row level security;
alter table reviews enable row level security;
alter table coupons enable row level security;
alter table testimonials enable row level security;
alter table home_text enable row level security;

-- Public read for storefront content
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read testimonials" on testimonials for select using (true);
create policy "public read home_text" on home_text for select using (true);
create policy "public read approved reviews" on reviews for select using (true);
create policy "public read coupons" on coupons for select using (true);

-- Admin full access (checks users.role = 'admin')
create policy "admin manage categories" on categories for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "admin manage products" on products for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "admin manage testimonials" on testimonials for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "admin manage home_text" on home_text for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "admin manage coupons" on coupons for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "admin manage reviews" on reviews for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "users insert own review" on reviews for insert with check (auth.uid() = user_id or user_id is null);

create policy "admin manage orders" on orders for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);
create policy "users read own orders" on orders for select using (auth.uid() = user_id);
create policy "users create own orders" on orders for insert with check (auth.uid() = user_id or user_id is null);
create policy "guests create orders" on orders for insert with check (user_id is null);

create policy "users manage own cart" on cart for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own wishlist" on wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own record" on users for select using (auth.uid() = id);
create policy "users update own record" on users for update using (auth.uid() = id);
create policy "users insert own record" on users for insert with check (auth.uid() = id);
create policy "admin read all users" on users for select using (
  exists (select 1 from users p2 where p2.id = auth.uid() and p2.role = 'admin')
);

-- Storage bucket: create a public bucket named "images" in Supabase Storage UI.
