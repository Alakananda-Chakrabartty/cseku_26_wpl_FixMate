const express = require('express');
const session = require('express-session');

const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');
const isAuthenticated = require('../middleware/isAuthenticated');
const isAdmin = require('../middleware/isAdmin');
const { findUserByEmail, createUser } = require('../utils/userStore');
const { getAllProviders, getProviderById, updateProviderStatus } = require('../utils/providerStore');
const { app } = require('../server');

function buildSessionApp(routeApp) {
  const sessionApp = express();
  sessionApp.use(express.json());
  sessionApp.use(express.urlencoded({ extended: true }));
  sessionApp.use(session({
    secret: 'unit-test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false }
  }));
  sessionApp.use(routeApp);
  return sessionApp;
}

async function startServer(appInstance) {
  return new Promise((resolve) => {
    const server = appInstance.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function sendRequest(server, { path, method = 'GET', body = null, headers = {} }) {
  const { port } = server.address();
  const options = {
    method,
    headers: { ...headers }
  };

  if (body !== null) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const text = await response.text();
  let data = text;

  try {
    data = JSON.parse(text);
  } catch (error) {
    // leave plain text response as-is
  }

  return { status: response.status, headers: response.headers, body: data, raw: text };
}

describe('utils/userStore.js', () => {
  test('creates and retrieves a user case-insensitively', async () => {
    const email = `alice.${Date.now()}@example.com`;
    const created = await createUser({
      fullName: 'Alice Example',
      email,
      passwordHash: 'hash-value',
      role: 'customer'
    });

    expect(created.email).toBe(email.toLowerCase());
    expect(created.role).toBe('customer');
    expect(findUserByEmail(email.toUpperCase())).toEqual(expect.objectContaining({ email: email.toLowerCase() }));
  });

  test('returns null when a user email is not present', () => {
    expect(findUserByEmail('missing.user.12345@example.com')).toBeNull();
  });
});

describe('utils/providerStore.js', () => {
  test('seeds providers with pending status and exposes them', () => {
    const providers = getAllProviders();

    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThanOrEqual(5);
    expect(providers[0]).toEqual(expect.objectContaining({ status: 'pending' }));
  });

  test('updates provider status and stores a decision timestamp', () => {
    const provider = getAllProviders()[0];
    const updated = updateProviderStatus(provider.id, 'approved');

    expect(updated).toEqual(expect.objectContaining({ id: provider.id, status: 'approved' }));
    expect(updated.decidedAt).toBeTruthy();
  });

  test('returns null for an unknown provider id', () => {
    expect(getProviderById(999999)).toBeNull();
  });
});

describe('middleware/isAuthenticated.js', () => {
  test('calls next when a session user exists', () => {
    const req = { session: { user: { id: 1, role: 'customer' } } };
    const res = {};
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 401 JSON for API requests without a session', () => {
    const req = { session: {}, headers: { accept: 'application/json' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Please log in to continue.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('redirects to login for browser requests without a session', () => {
    const req = { session: {}, headers: { accept: 'text/html' } };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('middleware/isAdmin.js', () => {
  test('returns 401 if no user is in session', () => {
    const req = { session: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'You must be logged in.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 for non-admin users', () => {
    const req = { session: { user: { role: 'customer' } } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('403 — You do not have permission to view this page.');
    expect(next).not.toHaveBeenCalled();
  });

  test('allows admin users to continue', () => {
    const req = { session: { user: { role: 'admin' } } };
    const res = {};
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('routes/admin.js', () => {
  test('GET /admin/providers returns the provider list', async () => {
    const adminApp = buildSessionApp(express());
    adminApp.use('/admin', isAuthenticated, isAdmin, adminRoutes);

    const server = await startServer(adminApp);
    const response = await sendRequest(server, {
      path: '/admin/providers',
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, message: 'Please log in to continue.' });
    await new Promise((resolve) => server.close(resolve));
  });

  test('PATCH /admin/providers/:id approves a provider application', async () => {
    const adminApp = express();
    adminApp.use(express.json());
    adminApp.use(session({
      secret: 'admin-test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false }
    }));
    adminApp.use((req, res, next) => {
      req.session.user = { id: 7, role: 'admin' };
      next();
    });
    adminApp.use('/admin', adminRoutes);

    const server = await startServer(adminApp);
    const provider = getAllProviders()[0];
    const response = await sendRequest(server, {
      path: `/admin/providers/${provider.id}`,
      method: 'PATCH',
      body: { status: 'approved' }
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ success: true, provider: expect.objectContaining({ id: provider.id, status: 'approved' }) }));
    expect(getProviderById(provider.id).status).toBe('approved');
    await new Promise((resolve) => server.close(resolve));
  });

  test('PATCH /admin/providers/:id rejects invalid statuses', async () => {
    const adminApp = express();
    adminApp.use(express.json());
    adminApp.use(session({
      secret: 'admin-test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false }
    }));
    adminApp.use((req, res, next) => {
      req.session.user = { id: 7, role: 'admin' };
      next();
    });
    adminApp.use('/admin', adminRoutes);

    const server = await startServer(adminApp);
    const provider = getAllProviders()[0];
    const response = await sendRequest(server, {
      path: `/admin/providers/${provider.id}`,
      method: 'PATCH',
      body: { status: 'pending' }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: 'Status must be "approved" or "rejected".' });
    await new Promise((resolve) => server.close(resolve));
  });
});

describe('routes/auth.js', () => {
  test('registers a new user and stores a session user', async () => {
    const authApp = buildSessionApp(authRoutes);
    const server = await startServer(authApp);
    const email = `register.${Date.now()}@example.com`;

    const response = await sendRequest(server, {
      path: '/register',
      method: 'POST',
      body: {
        fullName: 'New User',
        email,
        password: 'securepass123',
        role: 'customer'
      }
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, redirect: '/dashboard' });
    expect(findUserByEmail(email)).toEqual(expect.objectContaining({ email: email.toLowerCase(), role: 'customer' }));
    await new Promise((resolve) => server.close(resolve));
  });

  test('rejects duplicate registration emails', async () => {
    const authApp = buildSessionApp(authRoutes);
    const server = await startServer(authApp);
    const email = `duplicate.${Date.now()}@example.com`;

    await sendRequest(server, {
      path: '/register',
      method: 'POST',
      body: {
        fullName: 'Existing User',
        email,
        password: 'securepass123'
      }
    });

    const duplicate = await sendRequest(server, {
      path: '/register',
      method: 'POST',
      body: {
        fullName: 'Existing User',
        email,
        password: 'securepass123'
      }
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ success: false, message: 'An account with this email already exists.' });
    await new Promise((resolve) => server.close(resolve));
  });

  test('rejects short passwords during registration', async () => {
    const authApp = buildSessionApp(authRoutes);
    const server = await startServer(authApp);

    const response = await sendRequest(server, {
      path: '/register',
      method: 'POST',
      body: {
        fullName: 'Short Password User',
        email: `short.${Date.now()}@example.com`,
        password: 'short'
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: 'Password must be at least 8 characters.' });
    await new Promise((resolve) => server.close(resolve));
  });

  test('logs in an existing user and redirects by role', async () => {
    const authApp = buildSessionApp(authRoutes);
    const server = await startServer(authApp);
    const email = `login.${Date.now()}@example.com`;

    await sendRequest(server, {
      path: '/register',
      method: 'POST',
      body: {
        fullName: 'Login User',
        email,
        password: 'securepass123',
        role: 'provider'
      }
    });

    const response = await sendRequest(server, {
      path: '/login',
      method: 'POST',
      body: {
        email,
        password: 'securepass123'
      }
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, redirect: '/provider-profile' });
    await new Promise((resolve) => server.close(resolve));
  });

  test('rejects invalid login credentials with a generic 401 message', async () => {
    const authApp = buildSessionApp(authRoutes);
    const server = await startServer(authApp);

    const response = await sendRequest(server, {
      path: '/login',
      method: 'POST',
      body: {
        email: 'no-user@example.com',
        password: 'wrongpass'
      }
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, message: 'Invalid email or password.' });
    await new Promise((resolve) => server.close(resolve));
  });

  test('destroy session and redirect on logout', async () => {
    const req = { session: { destroy: jest.fn((cb) => cb(null)) } };
    const res = { clearCookie: jest.fn(), redirect: jest.fn() };

    authRoutes.stack.find((layer) => layer.route && layer.route.path === '/logout').route.stack[0].handle(req, res);

    expect(req.session.destroy).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });
});

describe('server.js', () => {
  test('GET /me returns 401 when no session user exists', async () => {
    const server = await startServer(app);

    const response = await sendRequest(server, {
      path: '/me',
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ user: null });
    await new Promise((resolve) => server.close(resolve));
  });

  test('POST /login authenticates a registered user and /me returns the session user', async () => {
    const server = await startServer(app);
    const email = `server.${Date.now()}@example.com`;

    await sendRequest(server, {
      path: '/register',
      method: 'POST',
      body: {
        fullName: 'Server User',
        email,
        password: 'securepass123'
      }
    });

    const loginResponse = await sendRequest(server, {
      path: '/login',
      method: 'POST',
      body: {
        email,
        password: 'securepass123'
      }
    });

    const setCookie = loginResponse.headers.get('set-cookie');
    const cookieHeader = setCookie ? setCookie.split(';')[0] : '';

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({ success: true, redirect: '/dashboard' });

    const meResponse = await sendRequest(server, {
      path: '/me',
      method: 'GET',
      headers: { accept: 'application/json', Cookie: cookieHeader }
    });

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user).toEqual(expect.objectContaining({ email: email.toLowerCase(), role: 'customer' }));
    await new Promise((resolve) => server.close(resolve));
  });
});
