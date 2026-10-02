<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project-specific guidance

- Keep all external secrets in environment variables only. Never ship real keys or credentials to the repository.
- Use Supabase Auth for Google sign-in and route users through the app after login.
- Store orders with a user_id tied to auth.users.id.
- Use server-side routes for checkout persistence and Mailgun email dispatch.
- Keep Mailgun API keys and secret configuration out of the browser bundle.
- Treat Paystack as optional for the storefront flow; do not block checkout on it.
- The SQL migration file lives in [supabase/schema.sql](supabase/schema.sql).
- Do not claim the external integrations are configured unless the real values are present in the environment and validated live.
