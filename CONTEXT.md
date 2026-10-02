# Project context

## Overview

This repository is prepared for a storefront flow required by the HNG Lesson 2 assignment. It is designed to support a shopper journey from sign-in to checkout and order history.

## Runtime stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth for Google sign-in
- Supabase Database for all app data, with Supabase Auth for user accounts
- Resend for confirmation emails
- Optional Paystack integration retained but not required for the core flow

## Current architecture

- Landing page: product listing and Google sign-in trigger
- Cart: localStorage-backed cart state
- Checkout: server-side order submission using authenticated user token
- Orders: server fetch using the auth session and user_id filtering
- Email: route-level order confirmation through Resend

## Supabase setup

The complete, rerunnable Supabase schema is in [supabase/schema.sql](supabase/schema.sql). It creates:

- storefront products, orders, and order items
- customer, invoice, payment, and inventory tables
- profiles linked to Supabase Auth users
- row-level security policies and supporting indexes

## Google OAuth preparation

The app expects:

- Site URL: http://localhost:3000
- Post-login redirect: http://localhost:3000/orders
- Supabase callback URL: https://<project-ref>.supabase.co/auth/v1/callback
- Google Cloud Console redirect URI: the Supabase callback URL above

Do not add real credentials to the repository.

## Resend preparation

A Resend request is triggered only after a successful checkout. The API key and sender address must come from environment variables and must never be exposed in frontend code.

## Environment variables

The public/server split is documented in [.env.example](.env.example).

## Manual configuration still required

The repository itself is prepared, but the following remain external tasks to complete in the real hosting environment:

- create the Supabase project
- enable Google provider in Supabase Auth
- set the Supabase URL, publishable key, and service-role key
- run the SQL migration
- add Resend credentials and configure an allowed sender
- confirm the real redirect URLs and final deployment domain

## Production verification checklist

After the external configuration is complete, validate the flow end-to-end:

1. Sign in with Google
2. Browse products
3. Add items to cart
4. Go to checkout
5. Submit the order
6. Check that the order is stored with the authenticated user_id
7. Confirm that the email is sent by Resend
8. Reload the app and verify the order history is still present after logout and re-login
