-- ======================================================================
-- FixMate - PostgreSQL Database Schema & Initial Seed Data
-- Hyper-Local Services Marketplace Platform
-- ======================================================================

-- 1. USERS TABLE (Supports Role-Based Access Control: customer, provider, admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROVIDER PROFILES TABLE
CREATE TABLE IF NOT EXISTS provider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    service_area VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    bio TEXT,
    experience_years INTEGER DEFAULT 1,
    starting_price DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    portfolio_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    aggregate_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']::TEXT[],
    available_slots TEXT[] DEFAULT ARRAY['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM']::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. VERIFICATION DOCUMENTS TABLE (NID, Trade License, Certificates)
CREATE TABLE IF NOT EXISTS verification_documents (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'National ID (NID)', 'Trade License', 'Vocational Certificate'
    document_url TEXT NOT NULL,
    document_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BOOKINGS TABLE (Availability Calendar & State Machine)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    service_address TEXT NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    notes TEXT,
    agreed_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined', 'paid_confirmed', 'in_progress', 'completed', 'cancelled')),
    cancelled_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate booking for same provider on same date and time slot unless cancelled/declined
    CONSTRAINT unique_active_provider_slot UNIQUE (provider_id, booking_date, time_slot, status)
);

-- 6. PAYMENTS TABLE (SSLCommerz / MFS bKash / Nagad)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'SSLCommerz', 'bKash', 'Nagad'
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_details JSONB,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRANSACTION LEDGERS TABLE (Automated Platform Commission Split)
CREATE TABLE IF NOT EXISTS transaction_ledgers (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    payment_id INTEGER NOT NULL REFERENCES payments(id),
    provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
    gross_amount DECIMAL(10, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL,
    platform_commission DECIMAL(10, 2) NOT NULL,
    net_provider_payout DECIMAL(10, 2) NOT NULL,
    payout_status VARCHAR(50) DEFAULT 'held' CHECK (payout_status IN ('held', 'eligible', 'paid_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. REVIEWS TABLE (Restricted to Completed Bookings only)
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PLATFORM SETTINGS TABLE (Global Commission & System Configuration)
CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. DISPUTES TABLE (Customer/Provider Issues Managed by Admin)
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    raised_by_user_id INTEGER NOT NULL REFERENCES users(id),
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================================
-- INDEXES FOR QUERY OPTIMIZATION & GEOLOCATION
-- ======================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_category ON provider_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_verified ON provider_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_lat_lon ON provider_profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date_slot ON bookings(provider_id, booking_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_transaction_ledgers_provider ON transaction_ledgers(provider_id);

-- ======================================================================
-- INITIAL SEED DATA
-- 7Nanda2 bcrypt hash: $2b$10$RE.07qzTL2lMQMOjnuB8/.6VR3ASmJg98a1wovo9/dvZ8LjNoikTu
-- ======================================================================

-- Platform Settings Seed
INSERT INTO platform_settings (key, value, description)
VALUES ('global_commission_percentage', '12.5', 'Global platform commission percentage deducted from gross bookings')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO categories (name, slug, icon, description)
VALUES
    ('Electrical Services', 'electrician', 'Zap', 'Wiring, circuit breakers, switches, lighting, generator setup'),
    ('Plumbing & Pipework', 'plumbing', 'Droplets', 'Leak repair, pipe fitting, sanitary fixture installations, water pumps'),
    ('AC & Refrigeration', 'ac-repair', 'Wind', 'AC gas refill, master servicing, compressor replacement, cooling issues'),
    ('Custom Tailoring & Alteration', 'tailoring', 'Scissors', 'Doorstep fitting, garment alterations, custom suit and traditional wear stitching'),
    ('Home Academic Tutoring', 'tutoring', 'BookOpen', 'Math, Science, English, ICT tutoring for primary and secondary students'),
    ('Appliance Repair', 'appliance-repair', 'Wrench', 'Washing machines, microwave ovens, refrigerators, kitchen appliances')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (email, password_hash, role, full_name, email_verified)
VALUES (
    'chakrabarttyalakananda@gmail.com',
        '$2b$10$RE.07qzTL2lMQMOjnuB8/.6VR3ASmJg98a1wovo9/dvZ8LjNoikTu',
    'admin',
        'Alakananda Chakrabartty',
        true
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email_verified = true;
