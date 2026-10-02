# Mariam Market Storefront

This project is prepared for the HNG storefront flow: Google sign-in, shopping, cart, checkout, order history, and Resend confirmation emails through Supabase-backed persistence.

## Architecture summary

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Authentication: Supabase Auth + Google OAuth
- Data layer: Supabase Database for storefront and sales-management data
- Email delivery: Resend API via server-side route handlers
- Checkout: cart stored in localStorage, final order created on the server using the signed-in user session
- Security: user-scoped order access, server-side token validation, and env-based secrets

## Current implementation status

The app code is ready for integration with the real external services. It includes:

- storefront landing page and product catalog
- add-to-cart flow with localStorage persistence
- checkout form with user-bound order creation
- order history page loaded from Supabase
- Resend confirmation email trigger after successful checkout
- environment template separating public and secret config

Supabase Database is the sole application data store. The app uses the Supabase client and does not need a separate PostgreSQL `DATABASE_URL`; Supabase's managed database is PostgreSQL internally.

## Supabase setup

Use the SQL file at [supabase/schema.sql](supabase/schema.sql) in your real Supabase project SQL editor.

Run the complete SQL file in the Supabase project SQL Editor. It is safe to rerun and creates or updates:

- public.products
- public.orders
- public.order_items
- public.customers
- public.invoices
- public.payments
- public.inventory_transactions
- public.profiles (linked to Supabase Auth users)

It also enables row-level security and adds sample storefront products. Server routes use the service-role key and verify the signed-in Supabase user before accessing protected data.

The current code is prepared for external integration; live Supabase, Google OAuth, and Resend configuration must be supplied in your environment.

## Google OAuth setup

The app is prepared for Supabase Auth + Google OAuth using these values:

- Site URL: http://localhost:3000
- App redirect after login: http://localhost:3000/orders
- Supabase OAuth callback: https://<project-ref>.supabase.co/auth/v1/callback
- Google OAuth redirect URI: use the Supabase callback URL above

The corresponding env vars are in [.env.example](.env.example).

## Resend setup

Add `RESEND_API_KEY` and `RESEND_FROM` to the server environment only. The email is sent from the server route after a successful checkout; the API key is never exposed to frontend code.

For initial testing, Resend's `onboarding@resend.dev` sender can only deliver to the email address associated with your Resend account. To send to other recipients, verify a domain in Resend and set `RESEND_FROM` to an address on that domain.

## Environment variables

See [.env.example](.env.example) for the full public/server split.

Frontend/public variables:

- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_AUTH_REDIRECT_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_GOOGLE_CLIENT_ID

Use the Supabase publishable key when available; the anon-key variable remains supported for existing setups.

Server-only variables:

- SUPABASE_SERVICE_ROLE_KEY
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY
- RESEND_API_KEY
- RESEND_FROM

## Local testing

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Production testing after external config

1. Configure Supabase Auth with Google.
2. Run the SQL from [supabase/schema.sql](supabase/schema.sql).
3. Enable email/password sign-up and configure the confirmation behavior you want in Supabase Auth.
4. Confirm customers, products, orders, invoices, payments, and inventory records are stored in Supabase.
5. Test the full flow: sign in -> shop -> cart -> checkout -> email -> order history.
6. Verify logout/login persistence of the same order history.

## Remaining manual configuration

The following must still be set by the developer outside this repository:

- Supabase project creation and environment values
- Google Cloud Console OAuth client setup
- Supabase Auth provider settings
- Run the updated schema in the Supabase SQL Editor
- Resend API key and sender setup
- live deployment URL and final redirect setup

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
