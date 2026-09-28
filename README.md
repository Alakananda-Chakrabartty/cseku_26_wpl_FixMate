# FixMate 🛠️
> **Hyper-Local On-Demand Service Marketplace**

FixMate is a full-stack platform designed to bridge the gap between local service providers and nearby customers. Featuring real-time interactive mapping, automated scheduling, verification workflows, and distance-based sorting, FixMate makes finding and hiring trusted local help seamless.

---

## 🌟 What's New This Week

### 📍 Interactive Mapping & Proximity Sorting
- **Provider Map Onboarding:** Integrated **Leaflet Maps (LFMaps)** into the provider registration and profile management flow. Providers are prompted to select and pin their exact service location.
- **Geospatial Coordinate Storage:** Captured latitude and longitude coordinates are persisted in the PostgreSQL database (`provider_profiles`).
- **Real-Time Distance Sorting:** Customers searching for services can now sort available service providers by distance (closest to furthest) relative to their current location.

---

## ✨ Features

### 👤 Customer Experience
- **Service Discovery:** Explore services with category filtering and distance-based sorting.
- **Real-Time Booking:** Schedule service appointments directly with local providers.
- **Location Tracking:** Interactive map interface powered by LFMaps to view nearby service availability.

### 💼 Provider Hub & Ledger
- **Profile & Location Setup:** Set interactive map pins, work experience, bio, and weekly availability schedules.
- **Verification Center:** Submit NID/Identity credentials for admin review and platform verification badges.
- **Job & Earnings Management:** Track incoming booking requests, customer communications, and payout ledgers.

### 🛡️ Administration Engine
- **Verification Queue:** Review pending provider verification submissions and NID documents.
- **Platform Telemetry:** Monitor marketplace analytics, total user activity, and platform commission metrics.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Leaflet Maps (`react-leaflet`)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL, pgAdmin
- **Authentication & Email:** JWT / Session Auth, Nodemailer (Gmail SMTP)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** (v14+ recommended)
- **npm** or **yarn**

### 1. Repository Setup
```bash
git clone [https://github.com/your-username/fixmate.git](https://github.com/your-username/fixmate.git)
cd fixmate
npm install
