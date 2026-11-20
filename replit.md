# BeautyPass

Marketplace gratuito de beleza em São Paulo, com atendimento exclusivamente presencial nos salões parceiros e pagamento por agendamento em reais. “Sua beleza, no seu tempo.”

## Run & Operate

- Managed workflow `artifacts/beautypass: web` runs the client application.
- `pnpm --filter @workspace/beautypass run typecheck` — check the BeautyPass application.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- BeautyPass requires no secrets, database, or API server.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- BeautyPass: React, TypeScript, Tailwind CSS, Lucide, browser localStorage.
- Existing API/database packages are template infrastructure, not BeautyPass dependencies.

## Where things live

- `artifacts/beautypass/src/lib/` — seed data, pricing, shared browser state.
- `artifacts/beautypass/src/pages/` — client journeys and salon portal.
- `artifacts/beautypass/src/components/` — shell, vector artwork, cards, vouchers.

## Architecture decisions

- BeautyPass is exclusively an in-salon, pay-per-appointment marketplace. Do not reintroduce home service, subscriptions, monthly plans, virtual balances, top-ups or cashback. Why: the user explicitly deferred those product ideas.
- Client payments are simulated Pix or card payments in BRL; Pix is the default until the user saves a card preference. Why: access is free and each appointment is paid individually.
- Partner/client synchronization is local to this browser and same-origin browser tabs. Why: this hackathon explicitly excludes a backend.
- Use the official BeautyPass Android photos and botanical emblems as normal public image sources, with mint-tinted icon fallbacks. Why: the user requested Android brand fidelity rather than abstract illustrations.
- Migrate existing local demo records instead of clearing them. Retain service-only price snapshots, vouchers, notes, favorites, rules and reviews; discard obsolete product fields. Why: changing the marketplace model must not erase users' demo bookings.
- Accumulated savings equal the BRL sum of base minus final prices on confirmed and completed bookings; cancelled bookings do not count. Why: the passport must show demonstrable savings, not a balance or reward currency.
- Verified reviews become available only for completed bookings and count once per voucher. Seed salon ratings retain their original weighting when new reviews are added. Why: the seed ratings must stay intact until a real demo review is submitted.
- Partner charts distinguish illustrative dynamic-pricing projections from completed-voucher payouts. Why: a local hackathon demo cannot claim to measure real conversion uplift.

## Product

PT-BR discovery and map, instant matching, salon agendas with economic slots, direct simulated Pix/card checkout in BRL, QR vouchers, cancellations and a personal savings passport. The salon portal manages dynamic discounts, checks in bookings and computes simulated D+1 payouts.

## User preferences

- Keep this hackathon MVP entirely client-side with persisted demo state and a one-click demo reset.
- Do not add backend services, databases, payment gateways, OAuth, external map tiles, or paid API keys.
- Payments and QR check-ins are simulations.
- Use PT-BR copy, mint/forest branding, crisp stroke icons, official real photography, no pure black and no emojis.
- Playfair Display is reserved for the wordmark, salon hero titles, and appointments/profile headers; other UI uses Inter.
- On desktop, default to the 412px phone showcase; the salon portal remains a wide dashboard.

## Gotchas

- Reset removes BeautyPass demo data only, not unrelated localStorage.
- Monetary values are BRL. Booking totals are service-only prices, without displacement surcharges; cancellation fees and the partner's 12% platform fee remain distinct.
- Confirmed booking prices are frozen snapshots; rule changes affect new bookings only.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
