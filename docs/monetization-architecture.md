# NEON//CORE Monetization Architecture

## Current state

The pricing page is an informational preview. Its upgrade dialog does not collect payment details, create an account, call a payment API, or grant Premium access. There is deliberately no `isPremium` browser flag and no checkout integration.

## Proposed product boundary

### Keep free

- Access to essential browser-based tools and accurate core calculations.
- Search, categories, theme selection, favorites, and recent tools.
- Local-only preferences and tool use without an account.
- Clearly labeled, low-interference advertising on the free tier.

Do not put ads over inputs, results, errors, or primary controls. Keep the tool experience useful when an ad provider is blocked or unavailable.

### Candidate Premium features

- An ad-free interface.
- Account-backed sync of favorites, preferences, and saved tool presets across devices.
- Saved configurations and useful tool history.
- More advanced workflows such as batch operations, when there is user demand.

Core calculations should stay free. Premium should add convenience or advanced workflow, not make the current utilities unusable. Cloud sync and saved account data need a backend. A feature implemented entirely in downloadable JavaScript cannot be securely gated by a client-side check; either keep it free or make the valuable data/action depend on a server that checks entitlement.

### Proposed plans

- Free: $0 AUD, supported by labeled ads.
- Lifetime Premium: $8.99 AUD, one payment, with the included Premium scope defined in the purchase terms.
- Premium subscription: $3.99 AUD per month, with access while the subscription is active.

The lifetime price is low relative to ongoing hosting and sync costs. Before offering it, decide exactly which future features it covers. Keep recurring-cost services within clear limits or reserve ongoing cloud services for the subscription. Set cancellation, refunds, tax/GST display, and Australian consumer-law terms before taking payment.

## Future Stripe flow

Wait until user demand justifies operating accounts, a database, and a backend. Stripe has no required cost in the current static preview because it is not integrated.

1. Add account authentication and a backend database. Store a user record, Stripe customer ID, subscription or one-time purchase records, and derived entitlements. Keep Stripe secret keys and webhook signing secrets in server environment variables, never in HTML or JavaScript.
2. The signed-in client requests a checkout session from the backend, choosing a plan by a short plan key such as `lifetime` or `monthly`. The server maps that key to its configured Stripe Price ID and amount. Never accept a client-supplied amount as authoritative. Use Stripe-hosted Checkout so NEON//CORE does not handle card numbers.
3. Configure a webhook endpoint over HTTPS. Verify Stripe's signature against the unmodified request body before processing it. Handle events idempotently and associate the Stripe customer with the authenticated account. Relevant events include `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.paid` or `invoice.payment_failed`.
4. Update the server-side purchase/subscription record and derive entitlements from verified payment and subscription state. A browser redirect to a success page is not proof of payment. Handle cancellation at period end, failed renewal, refund, dispute, and delayed or duplicated webhook delivery.
5. The client may request an entitlement summary such as `GET /api/me/entitlements` to display the correct interface. This is only presentation. Every backend endpoint that returns Premium data or performs a Premium action must authenticate the user and check the entitlement server-side on every request. Never grant access based on a query string, hidden button, localStorage value, or client-supplied `isPremium` field.
6. Create a billing-portal session on the backend for an authenticated user who wants to update payment details or cancel. Do not expose a reusable Stripe customer ID as authorization.

Useful backend pieces when that phase arrives: authentication, customer mapping, checkout-session creation, verified webhook processing, idempotent billing state, entitlement checks, billing-portal sessions, database migrations/backups, audit-safe logs, error monitoring, and account deletion/data-retention flows. Add rate limits and authorization checks, avoid logging payment or sensitive personal data, and keep a test/live environment boundary.

## Safe launch sequence

1. Keep the current tools, favorites, and theme local and free; validate demand without payment infrastructure.
2. Agree on Premium scope, lifetime limits, support expectations, refunds, and AUD/GST presentation.
3. Add a backend and account model only when cloud features or real purchases require them.
4. Integrate Stripe Checkout and webhooks in test mode; test duplicate/out-of-order webhooks, cancellation, refunds, failures, and unauthorized API access.
5. Launch payments only after server-side entitlement checks and operational support are ready.

The UI in `pricing.html` is a plan preview, not an access-control system. No Premium feature is enabled by its buttons.