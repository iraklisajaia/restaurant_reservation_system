# Restaurant Reservation System

## Setup

### Backend

```
cd backend
npm install
cp .env.example .env   # then fill in JWT_SECRET and MONGODB_URI
npm start               # or: node server.js
```

Required environment variables (see `backend/.env.example`):

- `JWT_SECRET` – any long random string, used to sign login tokens.
- `MONGODB_URI` – your MongoDB connection string (Atlas or self-hosted). All
  data (users, bookings, waitlist, settings) is stored in MongoDB via
  Mongoose. The two seeded accounts (`admin@burgerbonanza.com` /
  `Admin123!` and `staff@burgerbonanza.com` / `Staff123!`) are created
  automatically on first run if they don't already exist in the database.
- `MONGODB_DB_NAME` – optional, defaults to `rrsystem`.
- `SMTP_*` – optional; if unset, booking/waitlist confirmations are just
  logged to the console instead of emailed.

**If you're using MongoDB Atlas**, make sure the IP address the app runs
from is allow-listed under Atlas → Network Access, otherwise connections
will time out.

### Frontend

```
cd frontend
npm install
npm start
```

## Testing

Backend tests use Jest + Supertest and cover authentication, reservation
creation/update, role-based access control, and the table-capacity conflict
check.

Run them with:

```
cd backend
npm install
npm test
```

This runs 6 automated tests against the Express app directly. Since data is
now stored in MongoDB, a reachable `MONGODB_URI` (set in `backend/.env`) is
required for the tests to pass — they exercise the same `/api/...` routes
described below against your real (or test) database:

- `POST /api/auth/register` creates a Customer account and returns a token
- `POST /api/auth/login` rejects an incorrect password
- `POST /api/bookings` rejects requests without a token
- `POST /api/bookings` creates a reservation, then rejects a second one once the slot is full (409)
- `PUT /api/bookings/:id` is forbidden for a Customer (403)
- `PUT /api/bookings/:id` succeeds for Admin
