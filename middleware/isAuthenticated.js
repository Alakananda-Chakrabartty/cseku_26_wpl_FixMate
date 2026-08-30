/**
 * Protects private routes (e.g. /dashboard, /checkout).
 * ---------------------------------------------------------------
 * - Normal browser navigation with no active session is redirected
 *   to /login.
 * - AJAX/fetch requests (or clients that explicitly accept JSON)
 *   get a 401 JSON response instead, so client-side code can react
 *   without a full-page redirect.
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  const wantsJson =
    req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

  if (wantsJson) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }

  return res.redirect('/login');
}

module.exports = isAuthenticated;
