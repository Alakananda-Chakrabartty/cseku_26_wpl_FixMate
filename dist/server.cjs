var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");

// server/api.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);

// server/db.ts
var import_pg = __toESM(require("pg"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_path = __toESM(require("path"), 1);
var dbInstance = null;
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const latitudeDelta = (lat2 - lat1) * Math.PI / 180;
  const longitudeDelta = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}
async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString && !process.env.SQL_HOST) {
    throw new Error("DATABASE_URL or SQL_HOST must be configured. FixMate requires PostgreSQL.");
  }
  const pool = new import_pg.default.Pool(
    connectionString ? { connectionString } : {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : void 0
    }
  );
  const client = await pool.connect();
  client.release();
  dbInstance = {
    query: async (text, params) => {
      const result = await pool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    }
  };
  const schema = await import_promises.default.readFile(import_path.default.resolve(process.cwd(), "schema.sql"), "utf8");
  await dbInstance.query(schema);
  console.log("Connected to PostgreSQL and applied the database schema.");
  return dbInstance;
}

// server/email.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
function createEmailVerificationToken() {
  const rawToken = import_crypto.default.randomBytes(32).toString("hex");
  const tokenHash = import_crypto.default.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}
async function sendVerificationEmail(email, fullName, rawToken) {
  const smtpUser = process.env.GMAIL_USER;
  const smtpPassword = process.env.GMAIL_APP_PASSWORD;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  if (!smtpUser || !smtpPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be configured to send verification emails.");
  }
  const transporter = import_nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpPassword }
  });
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  await transporter.sendMail({
    from: `FixMate <${smtpUser}>`,
    to: email,
    subject: "Verify your FixMate email address",
    text: `Hello ${fullName}, verify your FixMate account here: ${verificationUrl}`,
    html: `<p>Hello ${fullName},</p><p><a href="${verificationUrl}">Verify your FixMate email address</a></p><p>This link expires in 24 hours.</p>`
  });
}

// server/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "fixmate_jwt_super_secret_production_key_2026";
function generateToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  return import_jsonwebtoken.default.verify(token, JWT_SECRET);
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Missing or invalid Bearer token." });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Session expired or invalid token. Please log in again." });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Your role is '${req.user.role}'`
      });
      return;
    }
    next();
  };
}

// server/api.ts
var router = (0, import_express.Router)();
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, role, full_name, phone, category_id, service_area, starting_price, bio } = req.body;
    if (!email || !password || !role || !full_name) {
      res.status(400).json({ error: "Email, password, role, and full name are required." });
      return;
    }
    const sanitizedEmail = String(email).trim().toLowerCase();
    const validRoles = ["customer", "provider", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(", ")}` });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }
    const db = await getDb();
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [sanitizedEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "An account with this email address already exists." });
      return;
    }
    const passwordHash = await import_bcryptjs.default.hash(password, 10);
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, full_name, phone, avatar_url, email_verified`,
      [sanitizedEmail, passwordHash, role, full_name.trim(), phone?.trim() || null, defaultAvatar]
    );
    const newUser = userRes.rows[0];
    let providerId = void 0;
    if (role === "provider") {
      const selectedCatId = Number(category_id) || 1;
      const area = service_area?.trim() || "Sonadanga, Khulna";
      const price = Number(starting_price) || 500;
      const provBio = bio?.trim() || "Experienced local service technician dedicated to high quality work.";
      const lat = 22.8456;
      const lng = 89.5403;
      const pRes = await db.query(
        `INSERT INTO provider_profiles (
          user_id, category_id, service_area, latitude, longitude,
          bio, experience_years, starting_price, is_verified, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [newUser.id, selectedCatId, area, lat, lng, provBio, 2, price, false, "pending"]
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
      message: "Registration successful. Check your Gmail inbox to verify your account before signing in.",
      requiresEmailVerification: true,
      user: { ...newUser, provider_id: providerId }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Internal server error during registration." });
  }
});
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const sanitizedEmail = String(email).trim().toLowerCase();
    const db = await getDb();
    const userRes = await db.query("SELECT * FROM users WHERE email = $1", [sanitizedEmail]);
    if (userRes.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const user = userRes.rows[0];
    if (!user.email_verified) {
      res.status(403).json({ error: "Please verify your email address before signing in." });
      return;
    }
    const isValidPassword = await import_bcryptjs.default.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    let providerId = void 0;
    if (user.role === "provider") {
      const provRes = await db.query("SELECT id, is_verified, verification_status FROM provider_profiles WHERE user_id = $1", [user.id]);
      if (provRes.rows.length > 0) {
        providerId = provRes.rows[0].id;
      }
    }
    const redirectUrl = user.role === "admin" ? "/admin" : user.role === "provider" ? "/provider-dashboard" : "/dashboard";
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      provider_id: providerId
    });
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        provider_id: providerId
      },
      redirectUrl
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Internal server error during login." });
  }
});
router.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userRes = await db.query(
      "SELECT id, email, role, full_name, phone, avatar_url, email_verified, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = userRes.rows[0];
    if (user.role === "provider") {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/auth/verify-email", async (req, res) => {
  try {
    const rawToken = String(req.query.token || "");
    if (!rawToken) {
      res.status(400).send("Invalid verification link.");
      return;
    }
    const tokenHash = import_crypto2.default.createHash("sha256").update(rawToken).digest("hex");
    const db = await getDb();
    const tokenRes = await db.query(
      `SELECT user_id FROM email_verification_tokens
       WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );
    if (tokenRes.rows.length === 0) {
      res.status(400).send("This verification link is invalid or expired.");
      return;
    }
    await db.query("UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [tokenRes.rows[0].user_id]);
    await db.query("DELETE FROM email_verification_tokens WHERE token_hash = $1", [tokenHash]);
    res.send("Email verified successfully. You can now return to FixMate and sign in.");
  } catch (error) {
    res.status(500).send(error.message || "Email verification failed.");
  }
});
router.put("/auth/profile", authenticateToken, async (req, res) => {
  try {
    const avatarUrl = typeof req.body.avatar_url === "string" ? req.body.avatar_url.trim() : "";
    if (!avatarUrl || !avatarUrl.startsWith("data:image/")) {
      res.status(400).json({ error: "A valid image file is required." });
      return;
    }
    if (avatarUrl.length > 3e6) {
      res.status(413).json({ error: "Profile photo must be smaller than 2 MB." });
      return;
    }
    const db = await getDb();
    const userRes = await db.query(
      "UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role, full_name, phone, avatar_url, email_verified, created_at",
      [avatarUrl, req.user.id]
    );
    res.json({ message: "Profile photo updated successfully.", user: userRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not update profile photo." });
  }
});
router.get("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});
router.get("/providers/profile", authenticateToken, requireRole("provider"), async (req, res) => {
  try {
    const db = await getDb();
    const provRes = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, u.full_name, u.email, u.phone, u.avatar_url
       FROM provider_profiles p
       JOIN users u ON p.user_id = u.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: "Provider profile not found." });
      return;
    }
    const provider = provRes.rows[0];
    const docRes = await db.query(
      "SELECT * FROM verification_documents WHERE provider_id = $1 ORDER BY created_at DESC",
      [provider.id]
    );
    res.json({ provider, documents: docRes.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/providers/profile", authenticateToken, requireRole("provider"), async (req, res) => {
  try {
    const { category_id, service_area, latitude, longitude, bio, experience_years, starting_price, portfolio_images } = req.body;
    const db = await getDb();
    const provRes = await db.query("SELECT id FROM provider_profiles WHERE user_id = $1", [req.user.id]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: "Provider profile not found" });
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
        provId
      ]
    );
    res.json({ message: "Profile updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/providers/documents", authenticateToken, requireRole("provider"), async (req, res) => {
  try {
    const { document_type, document_url, document_number } = req.body;
    if (!document_type || !document_url) {
      res.status(400).json({ error: "Document type and file are required." });
      return;
    }
    const db = await getDb();
    const provRes = await db.query("SELECT id FROM provider_profiles WHERE user_id = $1", [req.user.id]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: "Provider profile not found" });
      return;
    }
    const providerId = provRes.rows[0].id;
    const docRes = await db.query(
      `INSERT INTO verification_documents (provider_id, document_type, document_url, document_number, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [providerId, document_type.trim(), document_url, document_number?.trim() || "N/A"]
    );
    await db.query(
      `UPDATE provider_profiles SET verification_status = 'pending', is_verified = false WHERE id = $1`,
      [providerId]
    );
    res.status(201).json({
      message: "Verification document submitted for admin review.",
      document: docRes.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/categories", async (_req, res) => {
  try {
    const db = await getDb();
    const categoriesRes = await db.query(
      "SELECT id, name, slug, icon, description, is_active, created_at FROM categories WHERE is_active = true ORDER BY id ASC"
    );
    const countRes = await db.query(
      "SELECT category_id, COUNT(id) as count FROM provider_profiles GROUP BY category_id"
    );
    const countsMap = new Map(countRes.rows.map((r) => [Number(r.category_id), Number(r.count)]));
    const result = categoriesRes.rows.map((cat) => ({
      ...cat,
      provider_count: countsMap.get(Number(cat.id)) || 0
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/providers/search", async (req, res) => {
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
      verified_only
    } = req.query;
    const db = await getDb();
    const userLat = customer_lat ? parseFloat(String(customer_lat)) : 22.8456;
    const userLng = customer_lng ? parseFloat(String(customer_lng)) : 89.5403;
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
    let filtered = results.rows.map((row) => {
      const distKm = calculateDistanceKm(userLat, userLng, parseFloat(row.latitude), parseFloat(row.longitude));
      return {
        ...row,
        starting_price: parseFloat(row.starting_price),
        aggregate_rating: parseFloat(row.aggregate_rating),
        experience_years: parseInt(row.experience_years, 10),
        total_reviews: parseInt(row.total_reviews, 10),
        distance_km: distKm
      };
    });
    if (category_id) {
      filtered = filtered.filter((p) => p.category_id === Number(category_id));
    }
    if (category_slug) {
      filtered = filtered.filter((p) => p.category_slug === String(category_slug));
    }
    if (query) {
      const q = String(query).toLowerCase();
      filtered = filtered.filter(
        (p) => p.provider_name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q) || p.service_area.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q)
      );
    }
    if (area) {
      const areaFilter = String(area).toLowerCase();
      filtered = filtered.filter((p) => p.service_area.toLowerCase().includes(areaFilter));
    }
    if (min_rating) {
      const minR = parseFloat(String(min_rating));
      filtered = filtered.filter((p) => p.aggregate_rating >= minR);
    }
    if (price_min) {
      const pMin = parseFloat(String(price_min));
      filtered = filtered.filter((p) => p.starting_price >= pMin);
    }
    if (price_max) {
      const pMax = parseFloat(String(price_max));
      filtered = filtered.filter((p) => p.starting_price <= pMax);
    }
    if (max_distance) {
      const maxD = parseFloat(String(max_distance));
      filtered = filtered.filter((p) => p.distance_km <= maxD);
    }
    if (verified_only === "true") {
      filtered = filtered.filter((p) => p.is_verified === true);
    }
    filtered.sort((a, b) => {
      if (a.is_verified !== b.is_verified) {
        return a.is_verified ? -1 : 1;
      }
      return a.distance_km - b.distance_km;
    });
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/providers/:id", async (req, res) => {
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
      res.status(404).json({ error: "Provider not found." });
      return;
    }
    const provider = provRes.rows[0];
    const revRes = await db.query(
      `SELECT r.*, u.full_name as customer_name, u.avatar_url as customer_avatar
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [Number(id)]
    );
    let bookedSlots = [];
    if (date) {
      const bookedRes = await db.query(
        `SELECT time_slot FROM bookings
         WHERE provider_id = $1 AND booking_date = $2 AND status NOT IN ('declined', 'cancelled')`,
        [Number(id), date]
      );
      bookedSlots = bookedRes.rows.map((r) => r.time_slot);
    }
    res.json({
      provider: {
        ...provider,
        starting_price: parseFloat(provider.starting_price),
        aggregate_rating: parseFloat(provider.aggregate_rating)
      },
      reviews: revRes.rows,
      bookedSlots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/bookings", authenticateToken, requireRole("customer"), async (req, res) => {
  try {
    const { provider_id, category_id, booking_date, time_slot, service_address, customer_phone, notes } = req.body;
    if (!provider_id || !booking_date || !time_slot || !service_address || !customer_phone) {
      res.status(400).json({ error: "Provider, date, time slot, address, and phone number are required." });
      return;
    }
    const db = await getDb();
    const conflictCheck = await db.query(
      `SELECT id, status FROM bookings
       WHERE provider_id = $1 AND booking_date = $2 AND time_slot = $3
       AND status NOT IN ('declined', 'cancelled')`,
      [Number(provider_id), booking_date, time_slot]
    );
    if (conflictCheck.rows.length > 0) {
      res.status(409).json({
        error: `Conflict: This time slot (${time_slot} on ${booking_date}) has already been reserved for this service provider. Please select another slot.`
      });
      return;
    }
    const provRes = await db.query("SELECT starting_price, category_id FROM provider_profiles WHERE id = $1", [Number(provider_id)]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: "Selected provider does not exist." });
      return;
    }
    const agreedPrice = parseFloat(provRes.rows[0].starting_price);
    const catId = Number(category_id) || provRes.rows[0].category_id;
    const bookingRef = `FM-BK-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const newBookingRes = await db.query(
      `INSERT INTO bookings (
        booking_reference, customer_id, provider_id, category_id,
        booking_date, time_slot, service_address, customer_phone, notes,
        agreed_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'requested')
      RETURNING *`,
      [
        bookingRef,
        req.user.id,
        Number(provider_id),
        catId,
        booking_date,
        time_slot,
        service_address.trim(),
        customer_phone.trim(),
        notes?.trim() || null,
        agreedPrice
      ]
    );
    res.status(201).json({
      message: "Booking request sent to provider successfully. Awaiting provider confirmation.",
      booking: newBookingRes.rows[0]
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: error.message });
  }
});
router.get("/bookings", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
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
    let params = [];
    if (user.role === "customer") {
      sql += ` WHERE b.customer_id = $1 ORDER BY b.created_at DESC`;
      params = [user.id];
    } else if (user.role === "provider") {
      sql += ` WHERE p.user_id = $1 ORDER BY b.created_at DESC`;
      params = [user.id];
    } else {
      sql += ` ORDER BY b.created_at DESC`;
    }
    const bookingsRes = await db.query(sql, params);
    res.json(bookingsRes.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.patch("/bookings/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelled_reason } = req.body;
    const user = req.user;
    const db = await getDb();
    const bkRes = await db.query(
      `SELECT b.*, p.user_id as provider_user_id
       FROM bookings b
       JOIN provider_profiles p ON b.provider_id = p.id
       WHERE b.id = $1`,
      [Number(id)]
    );
    if (bkRes.rows.length === 0) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    const booking = bkRes.rows[0];
    const isCustomer = user.id === booking.customer_id;
    const isProvider = user.id === booking.provider_user_id;
    const isAdmin = user.role === "admin";
    if (!isCustomer && !isProvider && !isAdmin) {
      res.status(403).json({ error: "Unauthorized to modify this booking." });
      return;
    }
    const currentStatus = booking.status;
    const validStatuses = ["requested", "accepted", "declined", "paid_confirmed", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status: ${status}` });
      return;
    }
    if ((status === "accepted" || status === "declined") && !isProvider && !isAdmin) {
      res.status(403).json({ error: "Only the service provider can accept or decline bookings." });
      return;
    }
    if (status === "in_progress" && currentStatus !== "paid_confirmed" && !isAdmin) {
      res.status(400).json({ error: "Booking must be paid and confirmed before starting work." });
      return;
    }
    if (status === "completed" && !["in_progress", "paid_confirmed"].includes(currentStatus) && !isAdmin) {
      res.status(400).json({ error: "Cannot complete a booking that has not been confirmed or started." });
      return;
    }
    const updateRes = await db.query(
      `UPDATE bookings
       SET status = $1,
           cancelled_reason = COALESCE($2, cancelled_reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, cancelled_reason?.trim() || null, Number(id)]
    );
    if (status === "completed") {
      await db.query(`UPDATE transaction_ledgers SET payout_status = 'eligible' WHERE booking_id = $1`, [Number(id)]);
    }
    res.json({
      message: `Booking status updated to ${status}`,
      booking: updateRes.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/payments/checkout", authenticateToken, requireRole("customer"), async (req, res) => {
  try {
    const { booking_id, payment_method, account_number, notes } = req.body;
    if (!booking_id || !payment_method) {
      res.status(400).json({ error: "Booking ID and payment method are required." });
      return;
    }
    const validMethods = ["SSLCommerz", "bKash", "Nagad"];
    if (!validMethods.includes(payment_method)) {
      res.status(400).json({ error: `Supported payment methods: ${validMethods.join(", ")}` });
      return;
    }
    const db = await getDb();
    const bkRes = await db.query(
      `SELECT b.*, p.id as provider_id, u.full_name as provider_name
       FROM bookings b
       JOIN provider_profiles p ON b.provider_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [Number(booking_id), req.user.id]
    );
    if (bkRes.rows.length === 0) {
      res.status(404).json({ error: "Booking not found or not owned by you." });
      return;
    }
    const booking = bkRes.rows[0];
    if (booking.status !== "accepted") {
      res.status(400).json({
        error: `Cannot pay for a booking in '${booking.status}' state. Provider must accept the request first.`
      });
      return;
    }
    const existingPay = await db.query("SELECT id FROM payments WHERE booking_id = $1 AND status = $2", [booking.id, "success"]);
    if (existingPay.rows.length > 0) {
      res.status(400).json({ error: "This booking has already been paid and confirmed." });
      return;
    }
    const grossAmount = parseFloat(booking.agreed_price);
    const settingRes = await db.query(`SELECT value FROM platform_settings WHERE key = 'global_commission_percentage'`);
    const commissionPercent = settingRes.rows.length > 0 ? parseFloat(settingRes.rows[0].value) : 12.5;
    const platformCommission = Math.round(grossAmount * (commissionPercent / 100) * 100) / 100;
    const netProviderPayout = Math.round((grossAmount - platformCommission) * 100) / 100;
    const transactionId = `TXN-${payment_method.toUpperCase()}-${Math.floor(1e7 + Math.random() * 9e7)}`;
    const paymentDetails = JSON.stringify({
      gateway: payment_method === "SSLCommerz" ? "SSLCommerz Hosted Payment" : `${payment_method} Merchant Direct API`,
      account: account_number ? `****${String(account_number).slice(-4)}` : "Verified Wallet",
      currency: "BDT",
      notes: notes || "Instant payment authorization",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const payRes = await db.query(
      `INSERT INTO payments (booking_id, transaction_id, payment_method, amount, currency, status, payment_details)
       VALUES ($1, $2, $3, $4, 'BDT', 'success', $5) RETURNING *`,
      [booking.id, transactionId, payment_method, grossAmount, paymentDetails]
    );
    const payment = payRes.rows[0];
    const ledgerRes = await db.query(
      `INSERT INTO transaction_ledgers (
        booking_id, payment_id, provider_id, gross_amount,
        commission_percentage, platform_commission, net_provider_payout, payout_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'held') RETURNING *`,
      [booking.id, payment.id, booking.provider_id, grossAmount, commissionPercent, platformCommission, netProviderPayout]
    );
    const ledger = ledgerRes.rows[0];
    await db.query(`UPDATE bookings SET status = 'paid_confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [booking.id]);
    const receipt = {
      receipt_id: `RCPT-${booking.booking_reference}`,
      booking_reference: booking.booking_reference,
      transaction_id: transactionId,
      payment_method,
      gross_amount: grossAmount,
      currency: "BDT",
      commission_percentage: commissionPercent,
      platform_fee: platformCommission,
      net_provider_earning: netProviderPayout,
      paid_at: payment.paid_at,
      status: "Paid & Confirmed"
    };
    res.status(200).json({
      message: "Payment completed successfully. Booking is now confirmed.",
      payment,
      ledger,
      receipt
    });
  } catch (error) {
    console.error("Payment checkout error:", error);
    res.status(500).json({ error: error.message });
  }
});
router.get("/bookings/:id/receipt", authenticateToken, async (req, res) => {
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
      res.status(404).json({ error: "Receipt not found or booking is not yet paid." });
      return;
    }
    res.json(receiptRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/ledger/provider", authenticateToken, requireRole("provider"), async (req, res) => {
  try {
    const db = await getDb();
    const provRes = await db.query("SELECT id FROM provider_profiles WHERE user_id = $1", [req.user.id]);
    if (provRes.rows.length === 0) {
      res.status(404).json({ error: "Provider profile not found." });
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
      if (item.payout_status === "eligible") {
        availablePayout += net;
      }
    }
    res.json({
      summary: {
        total_gross: totalGross,
        total_commission_deducted: totalCommissionDeducted,
        total_net_earnings: totalNetEarnings,
        available_payout: availablePayout
      },
      ledgers: ledgerRes.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/reviews", authenticateToken, requireRole("customer"), async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!booking_id || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: "Booking ID and a valid rating (1-5 stars) are required." });
      return;
    }
    const db = await getDb();
    const bkRes = await db.query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2`,
      [Number(booking_id), req.user.id]
    );
    if (bkRes.rows.length === 0) {
      res.status(404).json({ error: "Booking not found or not owned by you." });
      return;
    }
    const booking = bkRes.rows[0];
    if (booking.status !== "completed") {
      res.status(400).json({
        error: `Only completed jobs can be rated and reviewed. Current booking status is '${booking.status}'.`
      });
      return;
    }
    const existingRev = await db.query("SELECT id FROM reviews WHERE booking_id = $1", [booking.id]);
    if (existingRev.rows.length > 0) {
      res.status(409).json({ error: "You have already submitted a review for this booking." });
      return;
    }
    const revRes = await db.query(
      `INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking.id, req.user.id, booking.provider_id, ratingNum, comment?.trim() || null]
    );
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
      message: "Review and rating submitted successfully. Provider rating updated.",
      review: revRes.rows[0],
      provider_aggregate_rating: newRating
    });
  } catch (error) {
    console.error("Review submission error:", error);
    res.status(500).json({ error: error.message });
  }
});
router.get("/admin/analytics", authenticateToken, requireRole("admin"), async (_req, res) => {
  try {
    const db = await getDb();
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
        total_provider_payouts: parseFloat(financeRes.rows[0]?.total_provider_payouts || 0)
      },
      current_commission_percentage: parseFloat(commissionSetting.rows[0]?.value || 12.5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/admin/verifications", authenticateToken, requireRole("admin"), async (_req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.patch("/admin/verifications/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
      return;
    }
    const db = await getDb();
    const docRes = await db.query(
      `UPDATE verification_documents
       SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes?.trim() || null, Number(id)]
    );
    if (docRes.rows.length === 0) {
      res.status(404).json({ error: "Verification document not found." });
      return;
    }
    const doc = docRes.rows[0];
    if (status === "approved") {
      await db.query(
        `UPDATE provider_profiles
         SET is_verified = true, verification_status = 'approved', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [doc.provider_id]
      );
    } else if (status === "rejected") {
      await db.query(
        `UPDATE provider_profiles
         SET is_verified = false, verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [doc.provider_id]
      );
    }
    res.json({
      message: `Document status updated to ${status}. Provider profile updated.`,
      document: doc
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/admin/settings", authenticateToken, requireRole("admin"), async (_req, res) => {
  try {
    const db = await getDb();
    const settings = await db.query("SELECT * FROM platform_settings");
    res.json(settings.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/admin/settings", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { global_commission_percentage } = req.body;
    const rate = parseFloat(global_commission_percentage);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      res.status(400).json({ error: "Commission percentage must be between 0% and 50%." });
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
      global_commission_percentage: rate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/admin/transactions", authenticateToken, requireRole("admin"), async (_req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var api_default = router;

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path2.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  app.use(import_express2.default.json({ limit: "10mb" }));
  app.use(import_express2.default.urlencoded({ extended: true, limit: "10mb" }));
  try {
    await getDb();
    console.log("FixMate Database initialized and ready.");
  } catch (err) {
    console.error("Database warmup error:", err);
    process.exit(1);
  }
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "FixMate API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.use("/api", api_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FixMate Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
