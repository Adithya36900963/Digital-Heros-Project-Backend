# Digital Heroes Backend

Node.js, Express, and MongoDB backend for the PRD subscription platform combining Stableford score tracking, charity contributions, monthly prize draws, winner verification, and admin controls.

## Quick Start

```bash
cd C:\Users\adith\Desktop\digital-heroes-backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Update `.env` with your MongoDB URI and JWT secret before running in production.

## Seeded Accounts

After `npm run seed`:

- Admin: `admin@digitalheroes.local` / `Admin123!`
- User: `user@digitalheroes.local` / `User123!`

## Main API Areas

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/dashboard/me`
- `POST /api/scores` with latest-5 rolling score logic and no duplicate score dates
- `GET /api/charities`, `POST /api/charities`, `PATCH /api/charities/:id`, `DELETE /api/charities/:id`
- `POST /api/subscriptions/checkout-session` and subscription lifecycle endpoints
- `POST /api/draws/simulate`, `POST /api/draws/publish`, `GET /api/draws`
- `POST /api/winners/:id/proof`, `PATCH /api/winners/:id/review`, `PATCH /api/winners/:id/paid`
- `GET /api/admin/analytics`

## Notes

- Stripe checkout creation is implemented behind `STRIPE_SECRET_KEY`; without it, the route returns a mock checkout payload for local development.
- Razorpay Checkout is implemented behind `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; keep the secret only in the backend `.env`.
- Winner proof uploads are stored in `uploads/proofs`.
- The draw engine supports random and algorithmic modes. Algorithmic mode weights numbers by score frequency across active subscribers.
- Subscription status is checked on protected subscriber routes through middleware.
