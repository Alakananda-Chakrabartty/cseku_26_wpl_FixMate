

/**
 * Authentication routes for FixMate.
 * ---------------------------------------------------------------
 *   POST /register  -> create an account (bcrypt-hashed password)
 *   POST /login      -> verify credentials, start a session
 *   GET  /logout     -> destroy the session, redirect to landing page
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser } = require('../utils/userStore');

const router = express.Router();
const SALT_ROUNDS = 10;

/** Strips sensitive fields before storing a user on the session. */
function toSessionUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
  };
}

/** Determines the post-auth redirect route based on user role. */
function getRedirectPath(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'provider':
      return '/provider-profile';   // was '/provider-dashboard'
    case 'customer':
    default:
      return '/dashboard';
  }
}

// -----------------------------------------------------------------
// POST /register
// -----------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate presence and trim input strings
    const trimmedName = fullName ? fullName.trim() : '';
    const trimmedEmail = email ? email.trim().toLowerCase() : '';

    if (!trimmedName || !trimmedEmail || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Full name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Check existing account (async-compatible)
    const existingUser = await findUserByEmail(trimmedEmail);
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'An account with this email already exists.' });
    }

    // Never store raw passwords — always hash before saving.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Validate role input (defaulting to customer)
    const validRole = role === 'provider' ? 'provider' : 'customer';

    const user = await createUser({
      fullName: trimmedName,
      email: trimmedEmail,
      passwordHash,
      role: validRole
    });

    // Log the user in immediately after a successful registration.
    req.session.user = toSessionUser(user);

    return res.status(201).json({ 
      success: true, 
      redirect: getRedirectPath(user.role) 
    });
  } catch (err) {
    console.error('Register error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// -----------------------------------------------------------------
// POST /login
// -----------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const trimmedEmail = email ? email.trim().toLowerCase() : '';

    if (!trimmedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(trimmedEmail);
    if (!user) {
      // Same message as a wrong password — don't reveal whether the email exists.
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    req.session.user = toSessionUser(user);

    return res.json({ 
      success: true, 
      redirect: getRedirectPath(user.role) 
    });
  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// -----------------------------------------------------------------
// GET /logout
// -----------------------------------------------------------------
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
});

module.exports = router;