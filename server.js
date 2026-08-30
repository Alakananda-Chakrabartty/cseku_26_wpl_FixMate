/**
 * FixMate — Express Server
 * ---------------------------------------------------------------
 * Serves static pages for the FixMate web app and manages
 * logged-in user state with express-session.
 *
 * Routes:
 *   GET  /            -> Landing page
 *   GET  /login       -> Login page
 *   GET  /register    -> Signup page
 *   POST /register    -> Create an account            (routes/auth.js)
 *   POST /login        -> Authenticate, start a session (routes/auth.js)
 *   GET  /logout        -> Destroy the session, redirect (routes/auth.js)
 *   GET  /dashboard    -> User dashboard          (session required)
 *   GET  /directory    -> Service provider directory
 *   GET  /checkout      -> Booking / payment checkout (session required)
 * ---------------------------------------------------------------
 */

const adminRoutes = require('./routes/admin');
const isAdmin = require('./middleware/isAdmin');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const isAuthenticated = require('./middleware/isAuthenticated');
const { findUserByEmail, createUser } = require('./utils/userStore');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// -----------------------------------------------------------------
// Dev-only: seed a single admin account into the in-memory store.
// Runs once at boot, inside this same process, so it lands in the
// same `users` Map that the login route reads from.
// Remove this once you migrate userStore.js to a real database —
// at that point, seeding becomes a one-time DB migration instead.
// -----------------------------------------------------------------
async function seedAdmin() {
  const email = 'chakrabarttyalakananda@gmail.com';       // change this
  const password = '7Nanda29';  // change this

  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`Admin account already present: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await createUser({ fullName: 'Admin User', email, passwordHash, role: 'admin' });
  console.log(`✅ Seeded admin account: ${email}`);
}

// -----------------------------------------------------------------
// Core middleware
// -----------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fixmate-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // Set to true once the app is served over HTTPS in production
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Serve static assets (css, js, images) from /public
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
const VIEWS_DIR = path.join(__dirname, 'views');

/** Returns a route handler that sends a static HTML file from /views */
function sendView(fileName) {
  return (req, res) => res.sendFile(path.join(VIEWS_DIR, fileName));
}

// -----------------------------------------------------------------
// Public routes
// -----------------------------------------------------------------
app.get('/', sendView('index.html'));
app.get('/login', sendView('login.html'));
//app.get('/register', sendView('register.html'));
app.get('/directory', sendView('directory.html'));

// -----------------------------------------------------------------
// Auth routes — POST /register, POST /login, GET /logout
// -----------------------------------------------------------------
app.use('/', authRoutes);

// -----------------------------------------------------------------
// Protected routes
// -----------------------------------------------------------------
app.get('/dashboard', isAuthenticated, sendView('dashboard.html'));
app.get('/checkout', isAuthenticated, sendView('checkout.html'));

// --- ADDING NEW ROUTES FOR MY NEW PAGES ---
app.get('/directory', (req, res) => res.sendFile(path.join(__dirname, 'views', 'directory.html')));
//app.get('/provider-profile', (req, res) => res.sendFile(path.join(__dirname, 'views', 'provider-profile.html')));
app.get('/admin', isAuthenticated, isAdmin, sendView('admin.html'));
app.use('/admin', isAuthenticated, isAdmin, adminRoutes);
app.get('/provider-dashboard', isAuthenticated, sendView('provider-dashboard.html'));
app.get('/provider-profile', isAuthenticated, sendView('provider-profile.html'));

// -----------------------------------------------------------------
// GET /me — returns the current session user (for client-side UI
// decisions like showing/hiding the Admin Panel link). Not a page,
// just a small JSON endpoint the frontend can fetch.
// -----------------------------------------------------------------
app.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ user: null });
  }
  res.json({ user: req.session.user });
});
// -----------------------------------------------------------------
// Fallback 404
// -----------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send('404 — Page not found.');
});

// -----------------------------------------------------------------
// Start server
// -----------------------------------------------------------------
if (require.main === module) {
  seedAdmin().then(() => {
    app.listen(PORT, () => {
      console.log(`FixMate server running at http://localhost:${PORT}`);
    });
  });
}

module.exports = { app, seedAdmin };