# FixMate

FixMate is a local services marketplace web application that connects customers with service providers.

## Branch 0.3

This branch contains the Express application with:

- Customer registration, login, logout, and session management
- Customer dashboard, provider directory, provider profiles, and checkout pages
- Provider dashboard and provider application status management
- Admin-only provider approval and rejection routes
- In-memory user and provider stores for development
- Jest unit tests covering authentication, authorization, stores, routes, and server behavior

## Requirements

- Node.js 18 or newer
- npm

## Setup

```bash
npm install
```

## Run the Application

```bash
npm start
```

The server runs at <http://localhost:3000> by default. Set `PORT` to use another port and set `SESSION_SECRET` to replace the development session secret.

For development with automatic restarts:

```bash
npm run dev
```

## Test

```bash
npm test
```

The current test suite contains 22 unit tests covering the main authentication and provider-management flows.

## Project Structure

```text
Views/          Static HTML pages
routes/         Authentication and admin routes
middleware/     Authentication and authorization middleware
utils/          In-memory user and provider stores
unit_tests/     Jest test suite
server.js       Express application entry point
```

## Development Note

The application currently uses in-memory stores, so users and provider data reset when the server restarts. Replace these stores with a persistent database before production use.
