/**
 * Admin-only API routes for managing provider verification.
 * Mounted under /admin in server.js, behind isAuthenticated + isAdmin.
 */

const express = require('express');
const { getAllProviders, updateProviderStatus } = require('../utils/providerStore');

const router = express.Router();

// GET /admin/providers -> list all provider applications
router.get('/providers', (req, res) => {
  res.json({ providers: getAllProviders() });
});

// PATCH /admin/providers/:id -> approve or reject one application
router.patch('/providers/:id', (req, res) => {
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be "approved" or "rejected".' });
  }

  const updated = updateProviderStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Provider not found.' });
  }

  res.json({ success: true, provider: updated });
});

module.exports = router;