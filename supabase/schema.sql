BEGIN;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  artist text DEFAULT 'Christy Black',
  medium text,
  dimensions text,
  availability_status text NOT NULL DEFAULT 'Available'
    CHECK (availability_status IN ('Available', 'Reserved', 'Sold')),
  slug text NOT NULL UNIQUE,
  description text,
  long_description text,
  price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_price numeric(12, 2) CHECK (compare_price IS NULL OR compare_price >= 0),
  images text[] DEFAULT ARRAY[]::text[],
  sizes text[],
  colors jsonb CHECK (colors IS NULL OR jsonb_typeof(colors) = 'array'),
  stock_status text NOT NULL DEFAULT 'in_stock'
    CHECK (stock_status IN ('in_stock', 'out_of_stock', 'preorder')),
  featured boolean NOT NULL DEFAULT false,
  new_arrival boolean NOT NULL DEFAULT false,
  sku text UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  visibility boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size text,
  color text
);

CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT wishlist_user_product_unique UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved boolean NOT NULL DEFAULT false,
  reviewer_name text
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(items) = 'array'),
  total numeric(12, 2),
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount >= 0),
  deposit_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  remaining_balance numeric(12, 2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'pending_payment', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text NOT NULL
    CHECK (payment_method IN ('paystack_deposit', 'meetup')),
  payment_status text NOT NULL
    CHECK (payment_status IN ('deposit_paid', 'pending_meetup_payment')),
  meetup_status text NOT NULL DEFAULT 'awaiting_meetup'
    CHECK (meetup_status IN ('awaiting_meetup', 'arranged', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text,
  customer_phone text,
  customer_address text,
  CONSTRAINT orders_amounts_balance
    CHECK (deposit_amount + remaining_balance = total_amount)
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount numeric(5, 2) NOT NULL CHECK (discount BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text NOT NULL,
  image text
);

CREATE TABLE IF NOT EXISTS public.home_text (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text NOT NULL DEFAULT 'The Christy Black Art Gallery',
  hero_subtitle text NOT NULL DEFAULT 'Discover original paintings and masterworks by Christy Black.',
  about_text text NOT NULL DEFAULT 'The Christy Black Art Gallery presents a collection of original paintings, created with expressive technique and enduring vision.',
  logo_url text,
  paystack_enabled boolean NOT NULL DEFAULT false
);

-- Case-insensitive coupon lookup uses ilike in the application.
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_case_insensitive_uidx
  ON public.coupons (lower(code));

CREATE INDEX IF NOT EXISTS products_category_id_idx
  ON public.products (category_id);

CREATE INDEX IF NOT EXISTS products_visible_featured_created_idx
  ON public.products (created_at DESC)
  WHERE visibility = true AND featured = true;

CREATE INDEX IF NOT EXISTS cart_user_id_idx
  ON public.cart (user_id);

CREATE INDEX IF NOT EXISTS wishlist_user_id_idx
  ON public.wishlist (user_id);

CREATE INDEX IF NOT EXISTS reviews_product_approved_created_idx
  ON public.reviews (product_id, approved, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_user_created_idx
  ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_created_idx
  ON public.orders (created_at DESC);

-- ---------------------------------------------------------------------
-- Admin helper and role protection
-- The SECURITY DEFINER lookup avoids recursive RLS evaluation on users.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.is_admin()
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only admins can change user roles'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_user_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS users_guard_role_change ON public.users;
CREATE TRIGGER users_guard_role_change
  BEFORE UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_role_change();

-- A guest order is returned by the application's INSERT ... SELECT request.
-- This transaction-local value lets RLS expose only that just-inserted row.
CREATE OR REPLACE FUNCTION public.capture_guest_order_return_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    PERFORM pg_catalog.set_config(
      'app.guest_order_return_id',
      NEW.id::text,
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_guest_order_return_id() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_capture_guest_return_id ON public.orders;
CREATE TRIGGER orders_capture_guest_return_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_guest_order_return_id();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_text ENABLE ROW LEVEL SECURITY;

-- Remove policies from the previous schema before installing the
-- non-recursive policies below.
DROP POLICY IF EXISTS "public read categories" ON public.categories;
DROP POLICY IF EXISTS "admin manage categories" ON public.categories;
DROP POLICY IF EXISTS "public read products" ON public.products;
DROP POLICY IF EXISTS "admin manage products" ON public.products;
DROP POLICY IF EXISTS "public read testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "admin manage testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "public read home_text" ON public.home_text;
DROP POLICY IF EXISTS "admin manage home_text" ON public.home_text;
DROP POLICY IF EXISTS "public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "users insert own review" ON public.reviews;
DROP POLICY IF EXISTS "admin manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "admin manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "admin manage orders" ON public.orders;
DROP POLICY IF EXISTS "users read own orders" ON public.orders;
DROP POLICY IF EXISTS "users create own orders" ON public.orders;
DROP POLICY IF EXISTS "guests create orders" ON public.orders;
DROP POLICY IF EXISTS "users manage own cart" ON public.cart;
DROP POLICY IF EXISTS "users manage own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "users read own record" ON public.users;
DROP POLICY IF EXISTS "users update own record" ON public.users;
DROP POLICY IF EXISTS "users insert own record" ON public.users;
DROP POLICY IF EXISTS "admin read all users" ON public.users;
DROP POLICY IF EXISTS "admin update users" ON public.users;
DROP POLICY IF EXISTS "guests read inserted order" ON public.orders;
DROP POLICY IF EXISTS "guests insert reviews" ON public.reviews;

-- Users: profile owners see/edit their profile; admins can manage roles.
CREATE POLICY "users read own record"
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admin read all users"
  ON public.users FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "users insert own record"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'customer');

CREATE POLICY "users update own record"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin update users"
  ON public.users FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Catalog and public content.
CREATE POLICY "public read categories"
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "public read products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (visibility = true);

CREATE POLICY "admin manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "public read testimonials"
  ON public.testimonials FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin manage testimonials"
  ON public.testimonials FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "public read home_text"
  ON public.home_text FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin manage home_text"
  ON public.home_text FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only active coupons are visible to shoppers.
CREATE POLICY "public read coupons"
  ON public.coupons FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "admin manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Reviews are public after approval; submissions remain unapproved.
CREATE POLICY "public read approved reviews"
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (approved = true);

CREATE POLICY "users insert own review"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    approved = false
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "guests insert reviews"
  ON public.reviews FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND approved = false);

CREATE POLICY "admin manage reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders: customers can only read their own; admins can manage all.
CREATE POLICY "users read own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "guests read inserted order"
  ON public.orders FOR SELECT TO anon
  USING (
    auth.uid() IS NULL
    AND id = NULLIF(
      current_setting('app.guest_order_return_id', true),
      ''
    )::uuid
  );

CREATE POLICY "users create own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "guests create orders"
  ON public.orders FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "admin manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Cart and wishlist rows are strictly user-owned.
CREATE POLICY "users manage own cart"
  ON public.cart FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users manage own wishlist"
  ON public.wishlist FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Grants: SQL privileges are required in addition to RLS policies.
-- ---------------------------------------------------------------------

GRANT SELECT ON
  public.categories,
  public.products,
  public.testimonials,
  public.home_text
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.categories,
  public.products,
  public.testimonials,
  public.home_text
TO authenticated;

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;

GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;

GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT UPDATE, DELETE ON public.orders TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist TO authenticated;

-- ---------------------------------------------------------------------
-- Seed required homepage content
-- ---------------------------------------------------------------------

INSERT INTO public.home_text (hero_title, hero_subtitle, about_text)
SELECT
  'The Christy Black Art Gallery',
  'Discover original paintings and masterworks by Christy Black.',
  'The Christy Black Art Gallery presents a collection of original paintings, created with expressive technique and enduring vision.'
WHERE NOT EXISTS (SELECT 1 FROM public.home_text);

-- ---------------------------------------------------------------------
-- Supabase Storage: public image delivery, admin-only writes
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;

CREATE POLICY "Public can view gallery images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Admins can upload gallery images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images' AND public.is_admin());

CREATE POLICY "Admins can update gallery images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND public.is_admin())
  WITH CHECK (bucket_id = 'images' AND public.is_admin());

CREATE POLICY "Admins can delete gallery images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND public.is_admin());

GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

COMMIT;
