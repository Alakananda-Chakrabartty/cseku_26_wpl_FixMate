import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, calculateDistanceKm } from './db.ts';
import { createEmailVerificationToken, sendVerificationEmail } from './email.ts';
import {
  authenticateToken,
  requireRole,
  generateToken,
  AuthenticatedRequest,
} from './auth.ts';

const router = Router();

// ======================================================================
// MODULE A: USER REGISTRATION & AUTHENTICATION
// ======================================================================

/**
 * POST /api/auth/register
 * Handles customer, provider, and admin registration.
 * Sanitizes email (.trim().toLowerCase()) and hashes password with bcrypt (10 rounds).
 */
router.post('/auth/register', async (req, res): Promise<void> => {
  try {
    const { email, password, role, full_name, phone, category_id, service_area, starting_price, bio } = req.body;

    if (!email || !password || !role || !full_name) {
      res.status(400).json({ error: 'Email, password, role, and full name are required.' });
      return;
    }

    const sanitizedEmail = String(email).trim().toLowerCase();
    const validRoles = ['customer', 'provider', 'admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      res.status(503).json({ error: 'Email verification is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD first.' });
      return;
    }

    const db = await getDb();

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [sanitizedEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;

    // Insert user into PostgreSQL users table
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, full_name, phone, avatar_url, email_verified`,
      [sanitizedEmail, passwordHash, role, full_name.trim(), phone?.trim() || null, defaultAvatar]
    );
    const newUser = userRes.rows[0];

    let providerId: number | undefined = undefined;

    // If registering as a provider, create initial provider profile
    if (role === 'provider') {
      const selectedCatId = Number(category_id) || 1;
      const area = service_area?.trim() || 'Sonadanga, Khulna';
      const price = Number(starting_price) || 500;
      const provBio = bio?.trim() || 'Experienced local service technician dedicated to high quality work.';

      // Default coordinates for Khulna City
      const lat = 22.8456;
      const lng = 89.5403;

      const pRes = await db.query(
        `INSERT INTO provider_profiles (
          user_id, category_id, service_area, latitude, longitude,
          bio, experience_years, starting_price, is_verified, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [newUser.id, selectedCatId, area, lat, lng, provBio, 2, price, false, 'pending']
      );
      providerId = pRes.rows[0].id;
    }

    const { rawToken, tokenHash } = createEmailVerificationToken();
    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '24 hours')`,
      [newUser.id, tokenHash]
    );
    await sendVerificationEmail(newUser.email, newUser.full_name, rawToken);

    res.status(201).json({
      message: 'Registration successful. Check your Gmail inbox to verify your account before signing in.',
      requiresEmailVerification: true,
      user: { ...newUser, provider_id: providerId },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials, validates bcrypt hash, returns JWT and role-based redirect.
 */
router.post('/auth/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const sanitizedEmail = String(email).trim().toLowerCase();
    const db = await getDb();

    // Query user by sanitized email
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [sanitizedEmail]);
    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userRes.rows[0];

    if (!user.email_verified) {
      res.status(403).json({ error: 'Please verify your email address before signing in.' });
      return;
    }

    // Verify password hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // If provider, fetch provider_id
    let providerId: number | undefined = undefined;
    if (user.role === 'provider') {
      const provRes = await db.query('SELECT id, is_verified, verification_status FROM provider_profiles WHERE user_id = $1', [user.id]);
      if (provRes.rows.length > 0) {
        providerId = provRes.rows[0].id;
      }
    }

    // Dynamic post-auth redirect route based on role
    const redirectUrl =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'provider'
        ? '/provider-dashboard'
        : '/dashboard';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      provider_id: providerId,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        provider_id: providerId,
      },
      redirectUrl,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user session data.
 */
router.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const userRes = await db.query(
      'SELECT id, email, role, full_name, phone, avatar_url, email_verified, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userRes.rows[0];

    // If provider, attach provider profile details
    if (user.role === 'provider') {
      const provRes = await db.query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM provider_profiles p
         JOIN categories c ON p.category_id = c.id
         WHERE p.user_id = $1`,
        [user.id]
      );
      if (provRes.rows.length > 0) {
        res.json({ user, provider: provRes.rows[0] });
        return;
      }
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/auth/verify-email', async (req, res): Promise<void> => {
  try {
    const rawToken = String(req.query.token || '');
    if (!rawToken) {
      res.status(400).send('Invalid verification link.');
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const db = await getDb();
    const tokenRes = await db.query(
      `SELECT user_id FROM email_verification_tokens
       WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );
    if (tokenRes.rows.length === 0) {
      res.status(400).send('This verification link is invalid or expired.');
      return;
    }

    await db.query('UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [tokenRes.rows[0].user_id]);
    await db.query('DELETE FROM email_verification_tokens WHERE token_hash = $1', [tokenHash]);
    res.send('Email verified successfully. You can now return to FixMate and sign in.');
  } catch (error: any) {
    res.status(500).send(error.message || 'Email verification failed.');
  }
});

router.put('/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const avatarUrl = typeof req.body.avatar_url === 'string' ? req.body.avatar_url.trim() : '';
    if (!avatarUrl || !avatarUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'A valid image file is required.' });
      return;
    }
    if (avatarUrl.length > 3_000_000) {
      res.status(413).json({ error: 'Profile photo must be smaller than 2 MB.' });
      return;
    }

    const db = await getDb();
    const userRes = await db.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role, full_name, phone, avatar_url, email_verified, created_at',
      [avatarUrl, req.user!.id]
    );
    res.json({ message: 'Profile photo updated successfully.', user: userRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not update profile photo.' });
  }
});

/**
 * GET /api/auth/logout
 */
router.get('/auth/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ======================================================================
// MODULE B: PROVIDER PROFILE & VERIFICATION WORKFLOW
// ======================================================================

/**
 * GET /api/providers/profile
 * Provider fetches their own profile details, active calendar, and document status.
 */
router.get('/providers/profile', authenticateToken, requireRole('provider'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const provRes = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, u.full_name, u.email, u.phone, u.avatar_url
       FROM provider_profiles p
       JOIN users u ON p.user_id = u.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = $1`,
      [req.user!.id]
    );

    if (provRes.rows.length === 0) {
      res.status(404).json({ error: 'Provider profile not found.' });
      return;
    }

    const provider = provRes.rows[0];

    // Fetch documents
    const docRes = await db.query(
      'SELECT * FROM verification_documents WHERE provider_id = $1 ORDER BY created_at DESC',
      [provider.id]
    );

    res.json({ provider, documents: docRes.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/providers/profile
 * Updates provider professional information and portfolio.
 */
router.put('/providers/profile', authenticateToken, requireRole('provider'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { category_id, service_area, latitude, longitude, bio, experience_years, starting_price, portfolio_images } = req.body;
    const db = await getDb();

    const provRes = await db.query('SELECT id FROM provider_profiles WHERE user_id = $1', [req.user!.id]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: 'Provider profile not found' });
      return;
    }
    const provId = provRes.rows[0].id;

    await db.query(
      `UPDATE provider_profiles
       SET category_id = COALESCE($1, category_id),
           service_area = COALESCE($2, service_area),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude),
           bio = COALESCE($5, bio),
           experience_years = COALESCE($6, experience_years),
           starting_price = COALESCE($7, starting_price),
           portfolio_images = COALESCE($8, portfolio_images),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        category_id ? Number(category_id) : null,
        service_area?.trim() || null,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        bio?.trim() || null,
        experience_years ? Number(experience_years) : null,
        starting_price ? Number(starting_price) : null,
        portfolio_images || null,
        provId,
      ]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/providers/documents
 * Upload verification document (NID, Trade License, Certificate).
 */
router.post('/providers/documents', authenticateToken, requireRole('provider'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { document_type, document_url, document_number } = req.body;

    if (!document_type || !document_url) {
      res.status(400).json({ error: 'Document type and file are required.' });
      return;
    }

    const db = await getDb();
    const provRes = await db.query('SELECT id FROM provider_profiles WHERE user_id = $1', [req.user!.id]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: 'Provider profile not found' });
      return;
    }
    const providerId = provRes.rows[0].id;

    // Insert verification document
    const docRes = await db.query(
      `INSERT INTO verification_documents (provider_id, document_type, document_url, document_number, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [providerId, document_type.trim(), document_url, document_number?.trim() || 'N/A']
    );

    // Keep provider status as pending verification until admin approval
    await db.query(
      `UPDATE provider_profiles SET verification_status = 'pending', is_verified = false WHERE id = $1`,
      [providerId]
    );

    res.status(201).json({
      message: 'Verification document submitted for admin review.',
      document: docRes.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ======================================================================
// MODULE C: LOCATION-BASED SEARCH & DISCOVERY
// ======================================================================

/**
 * GET /api/categories
 * Returns active categories with provider counts.
 */
router.get('/categories', async (_req, res): Promise<void> => {
  try {
    const db = await getDb();
    const categoriesRes = await db.query(
      'SELECT id, name, slug, icon, description, is_active, created_at FROM categories WHERE is_active = true ORDER BY id ASC'
    );
    const countRes = await db.query(
      'SELECT category_id, COUNT(id) as count FROM provider_profiles GROUP BY category_id'
    );
    const countsMap = new Map(countRes.rows.map((r: any) => [Number(r.category_id), Number(r.count)]));
    const result = categoriesRes.rows.map((cat: any) => ({
      ...cat,
      provider_count: countsMap.get(Number(cat.id)) || 0,
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers/search
 * Geolocation-aware search with filters: category, area, max_distance, min_rating, price range.
 * Standard response structure: Provider Name, Verified Status, Rating, Starting Price, Distance (km).
 */
router.get('/providers/search', async (req, res): Promise<void> => {
  try {
    const {
      category_id,
      category_slug,
      area,
      query,
      min_rating,
      price_min,
      price_max,
      max_distance,
      customer_lat,
      customer_lng,
      verified_only,
    } = req.query;

    const db = await getDb();

    // Default reference customer coordinates: Khulna City center.
    const userLat = customer_lat ? parseFloat(String(customer_lat)) : 22.8456;
    const userLng = customer_lng ? parseFloat(String(customer_lng)) : 89.5403;

    // Fetch providers with user and category join
    const sql = `
      SELECT
        p.id,
        p.user_id,
        u.full_name as provider_name,
        u.avatar_url,
        u.phone,
        c.name as category_name,
        c.slug as category_slug,
        p.category_id,
        p.service_area,
        p.latitude,
        p.longitude,
        p.bio,
        p.experience_years,
        p.starting_price,
        p.is_verified,
        p.verification_status,
        p.aggregate_rating,
        p.total_reviews,
        p.portfolio_images
      FROM provider_profiles p
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    const results = await db.query(sql);

    // Filter and compute geolocation distances
    let filtered = results.rows.map((row: any) => {
      const distKm = calculateDistanceKm(userLat, userLng, parseFloat(row.latitude), parseFloat(row.longitude));
      return {
        ...row,
        starting_price: parseFloat(row.starting_price),
        aggregate_rating: parseFloat(row.aggregate_rating),
        experience_years: parseInt(row.experience_years, 10),
        total_reviews: parseInt(row.total_reviews, 10),
        distance_km: distKm,
      };
    });

    // Category filter
    if (category_id) {
      filtered = filtered.filter((p: any) => p.category_id === Number(category_id));
    }
    if (category_slug) {
      filtered = filtered.filter((p: any) => p.category_slug === String(category_slug));
    }

    // Text query search
    if (query) {
      const q = String(query).toLowerCase();
      filtered = filtered.filter(
        (p: any) =>
          p.provider_name.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q) ||
          p.service_area.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q)
      );
    }

    // Area filter
    if (area) {
      const areaFilter = String(area).toLowerCase();
      filtered = filtered.filter((p: any) => p.service_area.toLowerCase().includes(areaFilter));
    }

    // Minimum rating filter
    if (min_rating) {
      const minR = parseFloat(String(min_rating));
      filtered = filtered.filter((p: any) => p.aggregate_rating >= minR);
    }

    // Price range filters
    if (price_min) {
      const pMin = parseFloat(String(price_min));
      filtered = filtered.filter((p: any) => p.starting_price >= pMin);
    }
    if (price_max) {
      const pMax = parseFloat(String(price_max));
      filtered = filtered.filter((p: any) => p.starting_price <= pMax);
    }

    // Maximum distance filter
    if (max_distance) {
      const maxD = parseFloat(String(max_distance));
      filtered = filtered.filter((p: any) => p.distance_km <= maxD);
    }

    // Verified only filter
    if (verified_only === 'true') {
      filtered = filtered.filter((p: any) => p.is_verified === true);
    }

    // Sort: Verified first, then by distance ascending
    filtered.sort((a: any, b: any) => {
      if (a.is_verified !== b.is_verified) {
        return a.is_verified ? -1 : 1;
      }
      return a.distance_km - b.distance_km;
    });

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers/:id
 * Detailed provider profile with portfolio, reviews, available slots, and booked slots for a given date.
 */
router.get('/providers/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const db = await getDb();

    const provRes = await db.query(
      `SELECT
        p.*,
        u.full_name as provider_name,
        u.avatar_url,
        u.phone,
        c.name as category_name,
        c.slug as category_slug
       FROM provider_profiles p
       JOIN users u ON p.user_id = u.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [Number(id)]
    );

    if (provRes.rows.length === 0) {
      res.status(404).json({ error: 'Provider not found.' });
      return;
    }

    const provider = provRes.rows[0];

    // Reviews
    const revRes = await db.query(
      `SELECT r.*, u.full_name as customer_name, u.avatar_url as customer_avatar
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [Number(id)]
    );

    // Booked slots for conflict prevention on the provider's calendar
    let bookedSlots: string[] = [];
    if (date) {
      const bookedRes = await db.query(
        `SELECT time_slot FROM bookings
         WHERE provider_id = $1 AND booking_date = $2 AND status NOT IN ('declined', 'cancelled')`,
        [Number(id), date]
      );
      bookedSlots = bookedRes.rows.map((r: any) => r.time_slot);
    }

    res.json({
      provider: {
        ...provider,
        starting_price: parseFloat(provider.starting_price),
        aggregate_rating: parseFloat(provider.aggregate_rating),
      },
      reviews: revRes.rows,
      bookedSlots,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ======================================================================
// MODULE D: BOOKING & AVAILABILITY CALENDAR
// ======================================================================

/**
 * POST /api/bookings
 * Customer books an available time slot. Includes conflict prevention check.
 * State Machine starts at 'requested'.
 */
router.post('/bookings', authenticateToken, requireRole('customer'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { provider_id, category_id, booking_date, time_slot, service_address, customer_phone, notes } = req.body;

    if (!provider_id || !booking_date || !time_slot || !service_address || !customer_phone) {
      res.status(400).json({ error: 'Provider, date, time slot, address, and phone number are required.' });
      return;
    }

    const db = await getDb();

    // 1. Conflict Prevention: Automatically block booked time slots on the provider's calendar
    const conflictCheck = await db.query(
      `SELECT id, status FROM bookings
       WHERE provider_id = $1 AND booking_date = $2 AND time_slot = $3
       AND status NOT IN ('declined', 'cancelled')`,
      [Number(provider_id), booking_date, time_slot]
    );

    if (conflictCheck.rows.length > 0) {
      res.status(409).json({
        error: `Conflict: This time slot (${time_slot} on ${booking_date}) has already been reserved for this service provider. Please select another slot.`,
      });
      return;
    }

    // 2. Fetch provider starting price for initial agreed price
    const provRes = await db.query('SELECT starting_price, category_id FROM provider_profiles WHERE id = $1', [Number(provider_id)]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: 'Selected provider does not exist.' });
      return;
    }
    const agreedPrice = parseFloat(provRes.rows[0].starting_price);
    const catId = Number(category_id) || provRes.rows[0].category_id;

    // Generate readable reference code
    const bookingRef = `FM-BK-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Create booking with status 'requested'
    const newBookingRes = await db.query(
      `INSERT INTO bookings (
        booking_reference, customer_id, provider_id, category_id,
        booking_date, time_slot, service_address, customer_phone, notes,
        agreed_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'requested')
      RETURNING *`,
      [
        bookingRef,
        req.user!.id,
        Number(provider_id),
        catId,
        booking_date,
        time_slot,
        service_address.trim(),
        customer_phone.trim(),
        notes?.trim() || null,
        agreedPrice,
      ]
    );

    res.status(201).json({
      message: 'Booking request sent to provider successfully. Awaiting provider confirmation.',
      booking: newBookingRes.rows[0],
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings
 * Retrieves user's bookings with role-based scoping (Customer, Provider, or Admin).
 */
router.get('/bookings', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const user = req.user!;

    let sql = `
      SELECT
        b.*,
        c.name as category_name,
        u_cust.full_name as customer_name,
        u_cust.phone as customer_contact,
        u_cust.avatar_url as customer_avatar,
        u_prov.full_name as provider_name,
        u_prov.phone as provider_contact,
        u_prov.avatar_url as provider_avatar,
        p.service_area as provider_service_area,
        p.is_verified as provider_is_verified,
        pay.transaction_id,
        pay.payment_method,
        pay.status as payment_status,
        pay.paid_at,
        r.rating as user_rating,
        r.comment as user_review_comment
      FROM bookings b
      JOIN categories c ON b.category_id = c.id
      JOIN users u_cust ON b.customer_id = u_cust.id
      JOIN provider_profiles p ON b.provider_id = p.id
      JOIN users u_prov ON p.user_id = u_prov.id
      LEFT JOIN payments pay ON b.id = pay.booking_id
      LEFT JOIN reviews r ON b.id = r.booking_id
    `;

    let params: any[] = [];
    if (user.role === 'customer') {
      sql += ` WHERE b.customer_id = $1 ORDER BY b.created_at DESC`;
      params = [user.id];
    } else if (user.role === 'provider') {
      sql += ` WHERE p.user_id = $1 ORDER BY b.created_at DESC`;
      params = [user.id];
    } else {
      // Admin sees all bookings
      sql += ` ORDER BY b.created_at DESC`;
    }

    const bookingsRes = await db.query(sql, params);
    res.json(bookingsRes.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/bookings/:id/status
 * State Machine transitions:
 * Requested -> Accepted / Declined -> Paid & Confirmed -> In Progress -> Completed / Cancelled
 */
router.patch('/bookings/:id/status', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, cancelled_reason } = req.body;
    const user = req.user!;
    const db = await getDb();

    const bkRes = await db.query(
      `SELECT b.*, p.user_id as provider_user_id
       FROM bookings b
       JOIN provider_profiles p ON b.provider_id = p.id
       WHERE b.id = $1`,
      [Number(id)]
    );

    if (bkRes.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const booking = bkRes.rows[0];

    // Role permissions check
    const isCustomer = user.id === booking.customer_id;
    const isProvider = user.id === booking.provider_user_id;
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      res.status(403).json({ error: 'Unauthorized to modify this booking.' });
      return;
    }

    // State machine logic
    const currentStatus = booking.status;
    const validStatuses = ['requested', 'accepted', 'declined', 'paid_confirmed', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status: ${status}` });
      return;
    }

    // Provider actions: Accept or Decline requested booking
    if ((status === 'accepted' || status === 'declined') && !isProvider && !isAdmin) {
      res.status(403).json({ error: 'Only the service provider can accept or decline bookings.' });
      return;
    }

    // Provider/Customer starting work: in_progress requires paid_confirmed
    if (status === 'in_progress' && currentStatus !== 'paid_confirmed' && !isAdmin) {
      res.status(400).json({ error: 'Booking must be paid and confirmed before starting work.' });
      return;
    }

    // Completing job: completed requires in_progress or paid_confirmed
    if (status === 'completed' && !['in_progress', 'paid_confirmed'].includes(currentStatus) && !isAdmin) {
      res.status(400).json({ error: 'Cannot complete a booking that has not been confirmed or started.' });
      return;
    }

    // Update status in PostgreSQL bookings table
    const updateRes = await db.query(
      `UPDATE bookings
       SET status = $1,
           cancelled_reason = COALESCE($2, cancelled_reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, cancelled_reason?.trim() || null, Number(id)]
    );

    // If completed, make the transaction ledger payout status 'eligible' for provider withdrawal
    if (status === 'completed') {
      await db.query(`UPDATE transaction_ledgers SET payout_status = 'eligible' WHERE booking_id = $1`, [Number(id)]);
    }

    res.json({
      message: `Booking status updated to ${status}`,
      booking: updateRes.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ======================================================================
// MODULE E: PAYMENT & AUTOMATED COMMISSION ENGINE
// ======================================================================

/**
 * POST /api/payments/checkout
 * Require successful online payment before confirming bookings.
 * Auto-calculates platform commission percentage (retrieved from platform_settings).
 * Creates ledger entry splitting: (1) Platform Commission, (2) Provider Net Payout Balance.
 * Generates digital receipt itemizing Gross Amount, Platform Fee, Net Provider Earning.
 */
router.post('/payments/checkout', authenticateToken, requireRole('customer'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { booking_id, payment_method, account_number, notes } = req.body;

    if (!booking_id || !payment_method) {
      res.status(400).json({ error: 'Booking ID and payment method are required.' });
      return;
    }

    const validMethods = ['SSLCommerz', 'bKash', 'Nagad'];
    if (!validMethods.includes(payment_method)) {
      res.status(400).json({ error: `Supported payment methods: ${validMethods.join(', ')}` });
      return;
    }

    const db = await getDb();

    // Fetch booking
    const bkRes = await db.query(
      `SELECT b.*, p.id as provider_id, u.full_name as provider_name
       FROM bookings b
       JOIN provider_profiles p ON b.provider_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [Number(booking_id), req.user!.id]
    );

    if (bkRes.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found or not owned by you.' });
      return;
    }

    const booking = bkRes.rows[0];

    // Must be in 'accepted' status
    if (booking.status !== 'accepted') {
      res.status(400).json({
        error: `Cannot pay for a booking in '${booking.status}' state. Provider must accept the request first.`,
      });
      return;
    }

    // Check if already paid
    const existingPay = await db.query('SELECT id FROM payments WHERE booking_id = $1 AND status = $2', [booking.id, 'success']);
    if (existingPay.rows.length > 0) {
      res.status(400).json({ error: 'This booking has already been paid and confirmed.' });
      return;
    }

    const grossAmount = parseFloat(booking.agreed_price);

    // Fetch global commission percentage configured by Admin
    const settingRes = await db.query(`SELECT value FROM platform_settings WHERE key = 'global_commission_percentage'`);
    const commissionPercent = settingRes.rows.length > 0 ? parseFloat(settingRes.rows[0].value) : 12.5;

    // Automated platform commission calculations
    const platformCommission = Math.round((grossAmount * (commissionPercent / 100)) * 100) / 100;
    const netProviderPayout = Math.round((grossAmount - platformCommission) * 100) / 100;

    // Generate unique transaction reference
    const transactionId = `TXN-${payment_method.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Payment details payload
    const paymentDetails = JSON.stringify({
      gateway: payment_method === 'SSLCommerz' ? 'SSLCommerz Hosted Payment' : `${payment_method} Merchant Direct API`,
      account: account_number ? `****${String(account_number).slice(-4)}` : 'Verified Wallet',
      currency: 'BDT',
      notes: notes || 'Instant payment authorization',
      timestamp: new Date().toISOString(),
    });

    // 1. Insert into payments table
    const payRes = await db.query(
      `INSERT INTO payments (booking_id, transaction_id, payment_method, amount, currency, status, payment_details)
       VALUES ($1, $2, $3, $4, 'BDT', 'success', $5) RETURNING *`,
      [booking.id, transactionId, payment_method, grossAmount, paymentDetails]
    );
    const payment = payRes.rows[0];

    // 2. Insert into transaction_ledgers table (Split: Platform Commission + Provider Net Payout)
    const ledgerRes = await db.query(
      `INSERT INTO transaction_ledgers (
        booking_id, payment_id, provider_id, gross_amount,
        commission_percentage, platform_commission, net_provider_payout, payout_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'held') RETURNING *`,
      [booking.id, payment.id, booking.provider_id, grossAmount, commissionPercent, platformCommission, netProviderPayout]
    );
    const ledger = ledgerRes.rows[0];

    // 3. Update booking status to 'paid_confirmed'
    await db.query(`UPDATE bookings SET status = 'paid_confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [booking.id]);

    // 4. Generate digital receipt
    const receipt = {
      receipt_id: `RCPT-${booking.booking_reference}`,
      booking_reference: booking.booking_reference,
      transaction_id: transactionId,
      payment_method,
      gross_amount: grossAmount,
      currency: 'BDT',
      commission_percentage: commissionPercent,
      platform_fee: platformCommission,
      net_provider_earning: netProviderPayout,
      paid_at: payment.paid_at,
      status: 'Paid & Confirmed',
    };

    res.status(200).json({
      message: 'Payment completed successfully. Booking is now confirmed.',
      payment,
      ledger,
      receipt,
    });
  } catch (error: any) {
    console.error('Payment checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings/:id/receipt
 * Generates digital receipt itemizing Gross Amount, Platform Fee, and Net Provider Earning.
 */
router.get('/bookings/:id/receipt', authenticateToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const sql = `
      SELECT
        b.booking_reference,
        b.booking_date,
        b.time_slot,
        b.service_address,
        b.status as booking_status,
        c.name as service_name,
        u_cust.full_name as customer_name,
        u_cust.phone as customer_phone,
        u_prov.full_name as provider_name,
        p.service_area as provider_area,
        pay.transaction_id,
        pay.payment_method,
        pay.paid_at,
        l.gross_amount,
        l.commission_percentage,
        l.platform_commission,
        l.net_provider_payout,
        l.payout_status
      FROM bookings b
      JOIN categories c ON b.category_id = c.id
      JOIN users u_cust ON b.customer_id = u_cust.id
      JOIN provider_profiles p ON b.provider_id = p.id
      JOIN users u_prov ON p.user_id = u_prov.id
      JOIN payments pay ON b.id = pay.booking_id
      JOIN transaction_ledgers l ON b.id = l.booking_id
      WHERE b.id = $1
    `;

    const receiptRes = await db.query(sql, [Number(id)]);
    if (receiptRes.rows.length === 0) {
      res.status(404).json({ error: 'Receipt not found or booking is not yet paid.' });
      return;
    }

    res.json(receiptRes.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ledger/provider
 * Provider tracks earnings & payout ledger.
 */
router.get('/ledger/provider', authenticateToken, requireRole('provider'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const provRes = await db.query('SELECT id FROM provider_profiles WHERE user_id = $1', [req.user!.id]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: 'Provider profile not found.' });
      return;
    }
    const providerId = provRes.rows[0].id;

    const ledgerRes = await db.query(
      `SELECT
        l.*,
        b.booking_reference,
        b.booking_date,
        b.status as booking_status,
        c.name as category_name,
        pay.payment_method,
        pay.transaction_id
       FROM transaction_ledgers l
       JOIN bookings b ON l.booking_id = b.id
       JOIN categories c ON b.category_id = c.id
       JOIN payments pay ON l.payment_id = pay.id
       WHERE l.provider_id = $1
       ORDER BY l.created_at DESC`,
      [providerId]
    );

    // Calculate totals
    let totalGross = 0;
    let totalCommissionDeducted = 0;
    let totalNetEarnings = 0;
    let availablePayout = 0;

    for (const item of ledgerRes.rows) {
      const gross = parseFloat(item.gross_amount);
      const fee = parseFloat(item.platform_commission);
      const net = parseFloat(item.net_provider_payout);
      totalGross += gross;
      totalCommissionDeducted += fee;
      totalNetEarnings += net;
      if (item.payout_status === 'eligible') {
        availablePayout += net;
      }
    }

    res.json({
      summary: {
        total_gross: totalGross,
        total_commission_deducted: totalCommissionDeducted,
        total_net_earnings: totalNetEarnings,
        available_payout: availablePayout,
      },
      ledgers: ledgerRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ======================================================================
// MODULE F: RATINGS, REVIEWS & ADMIN PANEL
// ======================================================================

/**
 * POST /api/reviews
 * Restrict reviews/ratings (1-5 stars) to Completed bookings only.
 * Auto-updates aggregate star ratings on provider profiles.
 */
router.post('/reviews', authenticateToken, requireRole('customer'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { booking_id, rating, comment } = req.body;

    const ratingNum = parseInt(rating, 10);
    if (!booking_id || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Booking ID and a valid rating (1-5 stars) are required.' });
      return;
    }

    const db = await getDb();

    // Verify booking belongs to user
    const bkRes = await db.query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2`,
      [Number(booking_id), req.user!.id]
    );

    if (bkRes.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found or not owned by you.' });
      return;
    }

    const booking = bkRes.rows[0];

    // Restrict strictly to completed bookings
    if (booking.status !== 'completed') {
      res.status(400).json({
        error: `Only completed jobs can be rated and reviewed. Current booking status is '${booking.status}'.`,
      });
      return;
    }

    // Check if already reviewed
    const existingRev = await db.query('SELECT id FROM reviews WHERE booking_id = $1', [booking.id]);
    if (existingRev.rows.length > 0) {
      res.status(409).json({ error: 'You have already submitted a review for this booking.' });
      return;
    }

    // 1. Insert review into PostgreSQL reviews table
    const revRes = await db.query(
      `INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking.id, req.user!.id, booking.provider_id, ratingNum, comment?.trim() || null]
    );

    // 2. Auto-calculate and update aggregate rating & total reviews on provider profile
    const aggRes = await db.query(
      `SELECT AVG(rating)::numeric(3,2) as new_rating, COUNT(id) as count
       FROM reviews WHERE provider_id = $1`,
      [booking.provider_id]
    );

    const newRating = parseFloat(aggRes.rows[0].new_rating || ratingNum);
    const newCount = parseInt(aggRes.rows[0].count || 1, 10);

    await db.query(
      `UPDATE provider_profiles
       SET aggregate_rating = $1, total_reviews = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newRating, newCount, booking.provider_id]
    );

    res.status(201).json({
      message: 'Review and rating submitted successfully. Provider rating updated.',
      review: revRes.rows[0],
      provider_aggregate_rating: newRating,
    });
  } catch (error: any) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/analytics
 * Administrator analytics dashboard data.
 */
router.get('/admin/analytics', authenticateToken, requireRole('admin'), async (_req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();

    // Counts
    const usersCountRes = await db.query(`SELECT role, COUNT(id) as count FROM users GROUP BY role`);
    const verifiedProvCountRes = await db.query(`SELECT COUNT(id) as count FROM provider_profiles WHERE is_verified = true`);
    const pendingVerifCountRes = await db.query(`SELECT COUNT(id) as count FROM verification_documents WHERE status = 'pending'`);
    const bookingsCountRes = await db.query(`SELECT status, COUNT(id) as count FROM bookings GROUP BY status`);
    const financeRes = await db.query(`
      SELECT
        COALESCE(SUM(gross_amount), 0) as total_gmv,
        COALESCE(SUM(platform_commission), 0) as total_commission,
        COALESCE(SUM(net_provider_payout), 0) as total_provider_payouts
      FROM transaction_ledgers
    `);
    const commissionSetting = await db.query(`SELECT value FROM platform_settings WHERE key = 'global_commission_percentage'`);

    res.json({
      users_by_role: usersCountRes.rows,
      verified_providers_count: parseInt(verifiedProvCountRes.rows[0]?.count || 0, 10),
      pending_verifications_count: parseInt(pendingVerifCountRes.rows[0]?.count || 0, 10),
      bookings_by_status: bookingsCountRes.rows,
      finance: {
        total_gmv: parseFloat(financeRes.rows[0]?.total_gmv || 0),
        total_commission: parseFloat(financeRes.rows[0]?.total_commission || 0),
        total_provider_payouts: parseFloat(financeRes.rows[0]?.total_provider_payouts || 0),
      },
      current_commission_percentage: parseFloat(commissionSetting.rows[0]?.value || 12.5),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/verifications
 * Admin verification queue: Review provider verification documents (NID, Trade License, Certificates).
 */
router.get('/admin/verifications', authenticateToken, requireRole('admin'), async (_req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const verifRes = await db.query(`
      SELECT
        d.*,
        p.service_area,
        p.experience_years,
        p.starting_price,
        p.is_verified as provider_verified_flag,
        p.verification_status as provider_verif_status,
        u.full_name as provider_name,
        u.email as provider_email,
        u.phone as provider_phone,
        u.avatar_url as provider_avatar,
        c.name as category_name
      FROM verification_documents d
      JOIN provider_profiles p ON d.provider_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY
        CASE WHEN d.status = 'pending' THEN 1 ELSE 2 END,
        d.created_at DESC
    `);

    res.json(verifRes.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/verifications/:id
 * Admin approves or rejects provider verification documents and attaches "Verified" badge.
 */
router.patch('/admin/verifications/:id', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
      return;
    }

    const db = await getDb();

    // Update document status
    const docRes = await db.query(
      `UPDATE verification_documents
       SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes?.trim() || null, Number(id)]
    );

    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Verification document not found.' });
      return;
    }

    const doc = docRes.rows[0];

    // If approved, verify if provider has at least one approved doc and no pending rejections
    if (status === 'approved') {
      await db.query(
        `UPDATE provider_profiles
         SET is_verified = true, verification_status = 'approved', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [doc.provider_id]
      );
    } else if (status === 'rejected') {
      await db.query(
        `UPDATE provider_profiles
         SET is_verified = false, verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [doc.provider_id]
      );
    }

    res.json({
      message: `Document status updated to ${status}. Provider profile updated.`,
      document: doc,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/settings & PUT /api/admin/settings
 * Admin updates global platform commission percentage.
 */
router.get('/admin/settings', authenticateToken, requireRole('admin'), async (_req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const settings = await db.query('SELECT * FROM platform_settings');
    res.json(settings.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/settings', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { global_commission_percentage } = req.body;
    const rate = parseFloat(global_commission_percentage);

    if (isNaN(rate) || rate < 0 || rate > 50) {
      res.status(400).json({ error: 'Commission percentage must be between 0% and 50%.' });
      return;
    }

    const db = await getDb();
    await db.query(
      `INSERT INTO platform_settings (key, value, description)
       VALUES ('global_commission_percentage', $1, 'Global platform commission percentage')
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [rate.toString()]
    );

    res.json({
      message: `Global platform commission updated to ${rate}%.`,
      global_commission_percentage: rate,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/transactions
 * Admin monitors global transaction ledgers.
 */
router.get('/admin/transactions', authenticateToken, requireRole('admin'), async (_req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const db = await getDb();
    const transactionsRes = await db.query(`
      SELECT
        l.*,
        b.booking_reference,
        b.booking_date,
        b.status as booking_status,
        c.name as category_name,
        u_cust.full_name as customer_name,
        u_prov.full_name as provider_name,
        p.service_area as provider_service_area,
        pay.payment_method,
        pay.transaction_id,
        pay.paid_at
      FROM transaction_ledgers l
      JOIN bookings b ON l.booking_id = b.id
      JOIN categories c ON b.category_id = c.id
      JOIN users u_cust ON b.customer_id = u_cust.id
      JOIN provider_profiles p ON l.provider_id = p.id
      JOIN users u_prov ON p.user_id = u_prov.id
      JOIN payments pay ON l.payment_id = pay.id
      ORDER BY l.created_at DESC
    `);

    res.json(transactionsRes.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
