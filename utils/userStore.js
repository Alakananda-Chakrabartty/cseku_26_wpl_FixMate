/**
 * In-memory user store — FOR DEVELOPMENT / DEMO ONLY.
 * ---------------------------------------------------------------
 * Replace this entire module with real database queries
 * (e.g. MongoDB + Mongoose, PostgreSQL + Prisma) before shipping.
 * Data here resets every time the server restarts and is never
 * persisted to disk.
 */

const users = new Map(); // key: lowercase email -> user record
let nextId = 1;

/** Finds a user by email (case-insensitive). Returns null if not found. */
function findUserByEmail(email) {
  return users.get(email.toLowerCase()) || null;
}

/**
 * Creates and stores a new user record.
 * `passwordHash` must already be a bcrypt hash — never store raw passwords.
 */
function createUser({ fullName, email, passwordHash, role = 'customer' }) {
  const user = {
    id: nextId++,
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role, // 'customer' | 'provider'
    createdAt: new Date().toISOString()
  };
  users.set(user.email, user);
  return user;
}

module.exports = { findUserByEmail, createUser };
