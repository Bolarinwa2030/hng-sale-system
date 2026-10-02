# Sales Management System — Architecture and MVP Plan

## 1. Requirements analysis

The business requirement is a scalable sales and operations system for a real business. The core value is to manage customers, products, sales orders, payments, inventory, invoicing, staff roles, and reporting from a single operational platform.

The business typically needs to answer the following questions quickly:

- Who is the customer and what have they purchased?
- What products are currently in stock and which are low?
- Which orders are pending, paid, or overdue?
- What revenue was generated in a date range?
- Which sales staff are performing best?
- Which invoices are unpaid?
- Which transactions are successful or failed?

The system therefore needs a strong operational data model, reliable accounting flow, secure payment processing, and proper user permissions.

## 2. Missing requirements identified

The original brief covers the major modules, but a production system also needs:

- business configuration and company profile
- tax configuration and default invoice settings
- multi-currency strategy (even if MVP uses NGN only)
- branch/warehouse support in future, but not necessarily in MVP
- customer status and credit limits for trade accounts
- order approval rules for large-value transactions
- refund policy and refund workflows
- recurring invoice support as a future feature
- audit trail for every financial transaction
- soft delete and archiving instead of hard delete
- duplicate prevention for payments and invoices
- data retention policy
- backup and restore process
- performance and pagination for high data volumes

## 3. Recommended feature set

### Core MVP

- Authentication and role-based access control
- Staff management and permissions
- Customer management
- Product and category management
- Inventory ledger and low-stock alerts
- Sales orders with draft, confirmed, paid, partial, and cancelled states
- Invoice generation and PDF/print capability
- Payment tracking with Paystack integration
- Webhook-driven status reconciliation
- Email notifications via Mailgun abstraction
- Dashboard analytics and filters
- Audit logs
- Basic reporting export
- Search, sorting, and pagination

### Phase 2 (recommended)

- purchase orders and supplier management
- expenses and petty cash tracking
- payment reminders and overdue invoice workflows
- staff commissions and sales targets
- inventory transfers between warehouses
- product variants and bundles
- tax/VAT engine
- SMS notifications
- recurring invoices

## 4. MVP vs future features

### MVP should include

- secure auth and RBAC
- customer, product, order, invoice, and payment flows
- inventory changes captured through a ledger
- dashboard analytics
- Paystack verification and webhook processing
- notification architecture
- report generation

### Future features to postpone

- advanced CRM, multi-branch, payroll, subscription billing, POS, WhatsApp, and mobile app
- massive custom workflows
a non-essential complexity that would slow delivery

## 5. Recommended technology stack

### Frontend

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- React Server Components where appropriate
- Form validation with a library such as Zod

### Backend

- Next.js server actions or route handlers for API endpoints
- Prisma ORM for schema modeling and migrations
- PostgreSQL as the production relational database
- Redis for queueing and caching if background jobs are required

### Payments and communications

- Paystack for primary payment processing
- Mailgun as the default transactional email provider
- provider abstraction layer for email and payment service switching

### DevOps and quality

- Docker and docker-compose
- GitHub Actions for CI
- environment variables via .env files and secret storage
- ESLint and TypeScript checks
- API and integration tests

## 6. System architecture

Use a modular domain-based architecture:

- auth
- users
- customers
- products
- inventory
- orders
- invoices
- payments
- notifications
- reports
- audit logs

This keeps business logic separated by responsibility and avoids putting everything into a single controller file.

Recommended layers:

1. UI layer (Next.js pages and components)
2. API layer (route handlers / server actions)
3. Service layer (business logic)
4. Data access layer (Prisma models)
5. Integration adapters (Paystack, Mailgun)
6. Jobs and notifications (async processing when needed)

## 7. Database design

Use PostgreSQL with a normalized relational schema.

Core entities:

- users
- roles
- permissions
- user_roles
- customers
- customer_addresses
- products
- categories
- product_prices
- inventory_transactions
- orders
- order_items
- invoices
- invoice_items
- payments
- payment_transactions
- notifications
- audit_logs
- company_settings

Important design decisions:

- financial records should not be hard-deleted
- inventory moves should be captured as ledger entries, not only as a current stock number
- audit logs should preserve user action records
- order and invoice status should be explicit and validated

## 8. API structure

Example route structure:

- /api/auth/login
- /api/auth/register
- /api/auth/refresh
- /api/users
- /api/customers
- /api/products
- /api/categories
- /api/orders
- /api/invoices
- /api/payments
- /api/payments/webhook/paystack
- /api/inventory
- /api/reports
- /api/notifications

Good API standards:

- consistent JSON responses
- standard validation
- pagination and filters
- error codes and message envelopes
- rate limiting on public endpoints

## 9. Payment architecture

Paystack should be integrated as a secure backend-only flow.

### Recommended flow

1. Order is created and total is finalized.
2. Backend creates Paystack transaction with metadata.
3. User is redirected to Paystack checkout.
4. Paystack sends webhook/event callback to backend.
5. Backend verifies transaction using Paystack API or webhook signature.
6. Payment status is updated idempotently.
7. Invoice and order status are reconciled.
8. Inventory is only adjusted when the order becomes valid and paid/confirmed.

### Important rules

- never trust frontend status flags
- verify with backend before updating revenue
- make webhook handlers idempotent
- record transaction references and metadata
- log all payment decision events

## 10. Email architecture

Email should be handled through an abstraction, not directly from controllers.

Recommended provider abstraction:

- EmailProvider interface
- MailgunEmailProvider implementation
- mock/test provider for local development

Use email for:

- welcome and verification emails
- password reset
- order confirmation
- payment success/failure
- invoice delivery
- low-stock alerts
- refund or cancellation updates

## 11. Security architecture

The system should treat security as a first-class feature.

Required safeguards:

- password hashing with bcrypt or Argon2
- JWT or secure session management
- role-based access control
- input validation and schema enforcement
- rate limiting on auth and payment endpoints
- CORS restriction
- CSRF for cookie-based auth
- secure secret storage
- webhook signature validation
- SQL injection protection through ORM/query parameterization
- XSS protection in UI rendering
- audit logging of sensitive admin actions

## 12. Business rules to define explicitly

These decisions need to be documented in the first implementation:

- Can an order exist without a customer?
- Can an invoice be edited after payment is completed?
- Is stock reduced on order creation or payment confirmation?
- Are refunds allowed for partial payment only?
- Who can cancel orders and under what conditions?
- Are discounts restricted to managers only?
- Can a product be deleted or only archived?
- Is customer credit allowed?

For MVP, a reasonable baseline is:

- order can be created with a customer or guest record
- stock decreases only when the order is confirmed/paid
- invoice edits are blocked after payment completion
- refunds require finance or manager authorization
- products are archived, not fully deleted

## 13. Development roadmap

### Phase 1 — Design and foundation

- requirements analysis
- architecture choices
- database schema draft
- project scaffold
- login and dashboard shell

### Phase 2 — Data and auth

- user model
- role permissions
- auth endpoints
- database migration setup

### Phase 3 — Core sales modules

- customers
- products
- inventory ledger
- orders
- invoices

### Phase 4 — Integrations

- Paystack integration
- webhook validation
- Mailgun notifications

### Phase 5 — Security and QA

- role enforcement
- audit logging
- integration tests
- edge case verification

### Phase 6 — DevOps and deployment

- Docker compose
- health checks
- CI pipeline
- production config hardening

## 14. Recommended MVP architecture decision

The best practical choice for this project is:

- Next.js for frontend and API
- PostgreSQL for the relational store
- Prisma for migrations and data access
- Paystack + webhook verification for payment processing
- Mailgun abstraction for email notifications
- modular domain architecture rather than a monolith-first anti-pattern

This is realistic for a small-to-medium business and keeps the system extensible without excessive complexity.

## 15. Initial implementation status

This project has been started as a modern Next.js foundation with:

- TypeScript enabled
- Tailwind set up
- a polished business dashboard UI shell
- sales-management module pages
- architecture documentation to guide the next implementation phases

The next step is to add the actual data model, auth flow, and backend modules in a structured and tested manner.
