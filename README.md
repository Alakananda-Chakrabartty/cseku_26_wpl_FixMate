

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
- Provider profiles are searchable for one calendar month after an admin verifies the monthly subscription payment.
- Review verification queues, users, analytics, transactions, and platform settings from the admin panel.

## Maps and Payments

### Maps and location

- Provider registration and profile editing use an interactive Leaflet map backed by OpenStreetMap tiles. Select a point by clicking the map, drag the marker, or use the browser's current-location permission.
- Selected coordinates are reverse-geocoded with the OpenStreetMap Nominatim service to suggest a locality name. The locality can also be entered manually.
- Provider search can use the browser's location to calculate nearby results. Maps do not require a Google Maps API key.
- OpenStreetMap tiles and Nominatim are external community services. Keep their attribution visible and follow their usage policies; they are not intended to be treated as an unlimited production geocoding service.

### Payment methods and review

- **Monthly provider subscription:** providers pay ৳500 separately using bKash or Nagad, then submit the transaction ID. An admin reviews the submission in the subscription queue. Approval enables the provider subscription for one month; rejection returns it for follow-up.
- **Booking checkout:** the checkout UI offers bKash, Nagad, and SSLCommerz. The current server implementation records a simulated successful checkout, creates an internal transaction reference and receipt, calculates the platform commission, and updates the booking. It does **not** contact bKash, Nagad, or SSLCommerz or process real money.
- Do not enter real wallet PINs, OTPs, or card security codes into the current checkout form. A production payment launch requires implementing and testing the providers' official hosted checkout/API flows and verifying payment callbacks before marking a transaction paid.

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
   JWT_SECRET=replace-with-a-long-random-secret
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=use-a-unique-password-at-least-7-characters
   GMAIL_USER=your-gmail-address@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-gmail-app-password
   ```

   The admin account is created or updated at startup only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Use a unique admin address and a password of at least 7 characters. Public registration is limited to customer and provider accounts; configure admin access through these environment variables.

   Gmail verification requires 2-Step Verification and a Google App Password. Do not use your normal Gmail password.

   Provider registration uses Leaflet with OpenStreetMap tiles to set a base location. OpenStreetMap attribution is shown on the map; follow the tile service usage policy for production traffic.

   `APP_URL` identifies the application URL. Keep it set to `http://localhost:3000` for local development. `GEMINI_API_KEY` is available for Gemini-powered features when enabled.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in a browser. The server also exposes `GET /api/health` for a basic health check.

The database schema and public category/commission seed data are applied automatically when the server starts. No default admin login is created.

## Deploy Publicly

FixMate needs a Node.js web service and a persistent PostgreSQL database; do not deploy it as a static-only site. A straightforward setup is a Render web service plus a managed PostgreSQL instance:

1. Push this project to a GitHub repository. Keep `.env` out of Git.
2. Create a PostgreSQL database with your hosting provider and copy its connection string.
3. Create a Node web service from the repository. Set the build command to `npm ci && npm run build`, the start command to `npm start`, and the health check path to `/api/health`.
4. Configure `DATABASE_URL`, `NODE_ENV=production`, a unique random `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 7 characters), `ADMIN_NAME`, `APP_URL`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` in the host's environment settings. Never put production secrets in repository files.
5. After deployment, open the hosted URL and confirm `/api/health` returns a status of `ok`. Add a custom domain in the hosting dashboard if desired; then add the domain to Google Search Console and submit a sitemap for indexing.

Hosting and database providers may charge for production services. Check their current plans before creating resources. Google Search Console helps Google discover the site; it does not host it, and indexing can take time.

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
