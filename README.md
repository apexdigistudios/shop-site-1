# ADOB'S IMPORTS HUB

A premium, minimal, monochrome luxury e-commerce storefront + admin dashboard built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql` (found in this repo) to create all tables, RLS policies, and seed the `home_text` row.
3. In Supabase Storage, create a **public** bucket named `images`.
4. Copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
   ```

5. To make a user an admin, sign up normally on the site, then in Supabase run:

   ```sql
   update users set role = 'admin' where id = '<user-uuid>';
   ```

6. Run `npm install` then `npm run dev`.

## Architecture

- **Frontend ↔ Supabase ↔ Admin** — all product, category, order, cart, wishlist, review, coupon, testimonial, and homepage-text data lives exclusively in Supabase. No mock/demo/local data is used for store content.
- **localStorage** is used ONLY for the light/dark theme preference (`theme` key).
- Dark/light mode toggle works instantly across every page (storefront + admin) using Tailwind's `dark:` class strategy, persisted to `localStorage`.
- The header is a fixed glassmorphism bar: visible immediately on the homepage, hidden at the top on all other routes and revealed on scroll.
- Empty states are shown gracefully whenever Supabase tables are empty (no crashes, no fallback content).

## Payments

- **Pay 50% Deposit** — online payments via Paystack Mobile Money or card. Set `VITE_PAYSTACK_PUBLIC_KEY` to your Paystack public key. Only 50% of the order total is collected online. After a successful callback, the order is created with `payment_method=paystack_deposit`, `payment_status=deposit_paid`, and `meetup_status=pending`.
- **Pay on Meetup** — no online payment. The order is created immediately with `payment_method=meetup`, `payment_status=pending_meetup_payment`, `meetup_status=pending`, and `status=pending_payment`, then the customer is redirected to WhatsApp to arrange product handover.
- Guests can add products to their bag; login is only required at checkout.

## Brand Color System (locked)

Pure White `#FFFFFF`, Luxury Black `#111111`, Deep Black `#000000`, Ash Grey `#8A8F98`, Soft Grey `#D9D9D9`, Warm Cream `#FCFBFA`, Beige Cream `#F5EFE8`, Border Ash `#D8CDC0`, Dark Grey `#222226`, Alert Red `#E04646`, WhatsApp Green `#25D366`.
