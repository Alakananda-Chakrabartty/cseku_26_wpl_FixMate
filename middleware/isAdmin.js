/**
 * Guards routes that only admin accounts may access.
 * Must run AFTER isAuthenticated (or otherwise assumes
 * req.session.user already exists) — it only checks role,
 * not whether someone is logged in at all.
 */
module.exports = function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in.' });
  }

  if (req.session.user.role !== 'admin') {
    return res.status(403).send('403 — You do not have permission to view this page.');
  }

  next();
};