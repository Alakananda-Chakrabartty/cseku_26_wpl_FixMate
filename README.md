## Run Locally

**Prerequisites:** Node.js and PostgreSQL


1. Install dependencies:
   `npm install`
2. Create a PostgreSQL database named `fixmate`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`.
4. Configure `GMAIL_USER` and a Google App Password in `.env` so new users can receive verification links. Gmail verification requires 2-Step Verification and an App Password; do not use your normal Gmail password.
5. Run the app:
   `npm run dev`

The schema is applied automatically on startup. The seeded admin account is `chakrabarttyalakananda@gmail.com` with password `7Nanda2`.
