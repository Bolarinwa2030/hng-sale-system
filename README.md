# Mariam Market Storefront

This project is prepared for the HNG storefront flow: Google sign-in, shopping, cart, checkout, order history, and Mailgun confirmation emails through Supabase-backed persistence.

## Architecture summary

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Authentication: Supabase Auth + Google OAuth
- Data layer: Supabase PostgreSQL tables for products, orders, and order items
- Email delivery: Mailgun API via server-side route handlers
- Checkout: cart stored in localStorage, final order created on the server using the signed-in user session
- Security: user-scoped order access, server-side token validation, and env-based secrets

## Current implementation status

The app code is ready for integration with the real external services. It includes:

- storefront landing page and product catalog
- add-to-cart flow with localStorage persistence
- checkout form with user-bound order creation
- order history page loaded from Supabase
- Mailgun confirmation email trigger after successful checkout
- environment template separating public and secret config

Important: Supabase, Google, and Mailgun are not configured yet. This repository contains the code-side preparation only.

## Supabase setup

Use the SQL file at [supabase/schema.sql](supabase/schema.sql) in your real Supabase project SQL editor.

Required tables:

- public.products
- public.orders
- public.order_items

Required features:

- UUID primary keys
- user ownership via auth.users.id
- order status and payment status tracking
- order-item totals
- row-level security policies
- indexes for user and order lookups

## Google OAuth setup

The app is prepared for Supabase Auth + Google OAuth using these values:

- Site URL: http://localhost:3000
- App redirect after login: http://localhost:3000/orders
- Supabase OAuth callback: https://<project-ref>.supabase.co/auth/v1/callback
- Google OAuth redirect URI: use the Supabase callback URL above

The corresponding env vars are in [.env.example](.env.example).

## Mailgun setup

Mailgun credentials must be added in the server environment only. The email is sent from the server route after a successful checkout and never from frontend code.

## Environment variables

See [.env.example](.env.example) for the full public/server split.

Frontend/public variables:

- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_AUTH_REDIRECT_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_GOOGLE_CLIENT_ID

Server-only variables:

- DATABASE_URL
- JWT_SECRET
- SUPABASE_SERVICE_ROLE_KEY
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY
- MAILGUN_API_KEY
- MAILGUN_DOMAIN
- MAILGUN_FROM

## Local testing

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Production testing after external config

1. Configure Supabase Auth with Google.
2. Run the SQL from [supabase/schema.sql](supabase/schema.sql).
3. Confirm orders and order items are created under the signed-in user.
4. Test the full flow: sign in -> shop -> cart -> checkout -> email -> order history.
5. Verify logout/login persistence of the same order history.

## Remaining manual configuration

The following must still be set by the developer outside this repository:

- Supabase project creation and environment values
- Google Cloud Console OAuth client setup
- Supabase Auth provider settings
- Mailgun domain and API key
- live deployment URL and final redirect setup

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
