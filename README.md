

# FixMate

FixMate is a hyper-local services marketplace for discovering vetted professionals, requesting service slots, and managing the full booking lifecycle.

## Features

- Search providers by category, service area, distance, price, rating, and availability.
- View provider profiles, portfolios, verification status, and customer reviews.
- Register as a customer or provider with role-based dashboards.
- Verify new accounts by email before signing in.
- Request bookings with a date, time slot, address, phone number, and service notes.
- Accept, decline, update, and track booking status from the relevant dashboard.
- Record checkout payments, generate digital receipts, and maintain provider ledger entries.
- Leave reviews after completed bookings.
- Submit provider verification documents such as National ID, trade license, or vocational certificates.
- Review verification queues, users, analytics, transactions, and platform settings from the admin panel.

## Tech Stack

- React 19 and TypeScript
- Vite with an Express server
- PostgreSQL
- JWT authentication with bcrypt password hashing
- Tailwind CSS and Lucide icons
- Nodemailer for Gmail account verification

## Run Locally

**Prerequisites:** Node.js and PostgreSQL

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database, for example `fixmate`.

3. Copy `.env.example` to `.env` and configure the required values:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/fixmate
   GMAIL_USER=your-gmail-address@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-gmail-app-password
   JWT_SECRET=replace-with-a-long-random-secret
   ```

   Gmail verification requires 2-Step Verification and a Google App Password. Do not use your normal Gmail password.

   `APP_URL` identifies the hosted application URL. `GEMINI_API_KEY` is available for Gemini-powered features when enabled by the deployment environment.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in a browser. The server also exposes `GET /api/health` for a basic health check.

The database schema and seed data are applied automatically when the server starts. The seed includes the default service categories, a 12.5% platform commission setting, and an admin account:

- Email: `chakrabarttyalakananda@gmail.com`
- Password: `7Nanda2`

Change or remove seeded credentials before deploying outside a development environment.

## Other Commands

```bash
npm test       # Run server and authentication tests
npm run lint   # Type-check without emitting files
npm run build  # Build the client and bundled production server
npm start      # Start the production bundle after npm run build
npm run preview # Preview the Vite client build
```

## Project Structure

- `src/` - React application, dashboards, modals, authentication context, and API client
- `server/` - Express API, authentication middleware, email delivery, and PostgreSQL access
- `schema.sql` - Database tables, indexes, categories, settings, and seed admin
- `test/` - Node test runner coverage for authentication and geographic distance helpers
