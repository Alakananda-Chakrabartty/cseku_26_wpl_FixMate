

# FixMate

FixMate is a local services marketplace for discovering vetted professionals, requesting service slots, and managing the full booking lifecycle.

## Features

- Search providers by category, service area, distance, price, rating, and availability.
- View provider profiles, portfolios, verification status, and customer reviews.
- Register as a customer or provider with role-based dashboards.
- Verify new accounts by email before signing in.
- Request bookings with a date, time slot, address, phone number, and service notes.
- Accept, decline, start, and track booking requests from the relevant dashboard.
- Customers and providers arrange service payments directly; FixMate displays the provider's minimum starting rate but does not collect service payments.
- Leave reviews after the scheduled service date.
- Contact FixMate support by email from the customer or provider dashboard.
- Submit provider verification documents such as National ID, trade license, or vocational certificates.
- Provider profiles are searchable for one calendar month after an admin verifies the monthly subscription payment.
- Review verification queues, users, analytics, transactions, and platform settings from the admin panel.

## Maps and Payments

### Maps and location

- Provider registration and profile editing use an interactive Leaflet map backed by OpenStreetMap tiles. Select a point by clicking the map, drag the marker, or use the browser's current-location permission.
- Selected coordinates are reverse-geocoded with the OpenStreetMap Nominatim service to suggest a locality name. The locality can also be entered manually.
- Provider search can use the browser's location to calculate nearby results. Maps do not require a Google Maps API key.
- OpenStreetMap tiles and Nominatim are external community services. Keep their attribution visible and follow their usage policies; they are not intended to be treated as an unlimited production geocoding service.

### Provider subscription and service payments

- **Monthly provider subscription:** providers pay ৳500 per month separately using bKash or Nagad, then submit the transaction ID. An admin reviews the submission in the subscription queue. Approval enables the provider subscription for one month; rejection returns it for follow-up.
- **Customer service payments:** FixMate does not process or record these. Customers and providers agree the final service price and payment method directly. Provider profiles show a minimum starting rate, not a fixed quote or an amount due through FixMate.
- **Help:** customers and providers can use the Help option to view `chakrabarttyalakananda@gmail.com` and the instruction to email that address if they face any issues.

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

   `APP_URL` identifies the application URL. Use `http://localhost:3000` for local development, or the computer's LAN address for local Wi-Fi testing. `VITE_API_URL` optionally configures the frontend API base URL; it defaults to `/api`. `VITE_ANDROID_API_URL` overrides it for the Android APK (for example, `http://192.168.1.10:3000/api`). `GEMINI_API_KEY` is available for Gemini-powered features when enabled.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in a browser. The server also exposes `GET /api/health` for a basic health check.

The database schema and public category seed data are applied automatically when the server starts. No default admin login is created.

## Deploy to Vercel + Neon

The frontend is served as a Vite static build, and `/api/*` is handled by an Express serverless function. The API and frontend use the same Vercel domain, so `VITE_API_URL` does not need to be set.

1. Create a free PostgreSQL project at [Neon](https://neon.tech/). Copy its pooled connection string from the Neon dashboard; it contains the database username and password, so keep it private.
2. Push this project to a GitHub repository. Do not commit `.env` or paste its secrets into chat.
3. In [Vercel](https://vercel.com/), import the repository and deploy it. The root `vercel.json` configures the Vite build, API function, and SPA fallback. Vercel assigns a free `*.vercel.app` domain automatically.
4. In Vercel **Project Settings → Environment Variables**, add these for Production (and Preview too if you want preview deployments to work):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `JWT_SECRET` | A unique random secret; generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `APP_URL` | Your assigned `https://<project-name>.vercel.app` URL |
   | `ADMIN_EMAIL` | Email address for your admin account |
   | `ADMIN_PASSWORD` | Unique admin password (at least 7 characters) |
   | `GMAIL_USER` | Gmail address used to send account verification |
   | `GMAIL_APP_PASSWORD` | Google App Password for that Gmail account |

   `ADMIN_EMAIL` and `ADMIN_PASSWORD` are optional if you do not want an admin account created. Gmail credentials are needed for email verification and account registration. Keep all secrets in Vercel's environment settings, not in the frontend `VITE_*` variables.
5. After adding or changing environment variables, redeploy from Vercel. Open `https://<project-name>.vercel.app/api/health`; a JSON status response confirms that the API function is reachable. The database schema and initial categories are applied when the API first connects to Neon.
6. Test registration, email verification, login, and the admin dashboard. If email verification is enabled, confirm the verification link uses your `vercel.app` address.

Neon and Vercel free plans have usage limits and can change; review their current limits before relying on this deployment for production traffic. Vercel serverless functions also have request-size limits, so large document uploads may require external object storage.

## Android APK

Build and install a debug APK without deploying the server. To use the app, keep PostgreSQL and the FixMate server running on your computer; the APK does not include either service.

1. For USB-free use, set `APP_URL` and `VITE_ANDROID_API_URL` in `.env` to the computer's current Wi-Fi IPv4 address before building (for example, `http://192.168.1.10:3000` and `http://192.168.1.10:3000/api`). Build and install the APK while the phone is connected by USB:

   ```powershell
   npm run android:sync
   .\android\gradlew.bat -p android assembleDebug
   adb install -r android\app\build\outputs\apk\debug\app-debug.apk
   ```

   The APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.

2. Connect the phone and computer to the same Wi-Fi network or phone hotspot. If Windows Firewall blocks the connection, run this once in an elevated PowerShell to allow only local-subnet devices to reach the server:

   ```powershell
   New-NetFirewallRule -DisplayName "FixMate local server" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -RemoteAddress LocalSubnet -Profile Private,Public
   ```

   Keep PostgreSQL and `npm run dev` running on the computer. Once installed, the app communicates over Wi-Fi and does not need USB debugging or `adb reverse`; you can unplug the phone. If the computer's Wi-Fi IP changes, update both environment values and rebuild/reinstall the APK.

3. For USB-only testing instead, connect an Android phone with USB debugging enabled and run:

   ```powershell
   adb reverse tcp:3000 tcp:3000
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

   The USB port reverse lets the app's API requests reach the local server. Keep the USB connection and local services running while using the app.

Building requires Node.js, JDK 17 or newer, and Android SDK platform/build tools. This is a debug APK.

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
