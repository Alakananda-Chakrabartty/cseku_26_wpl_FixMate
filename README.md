# 🛠️ Local Services Marketplace

> **Find a trusted service provider near you.**

A web-based marketplace that connects customers with verified local service providers — electricians, plumbers, AC technicians, mechanics, computer repairers, painters, cleaners, photographers, tutors, and tailors — with a focus on smaller cities and hyper-local, verified professionals.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.x-green)]()

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Usage Example](#usage-example)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About the Project

Existing service-marketplace platforms have already proven demand in Bangladesh, but most focus on major metro areas. **Local Services Marketplace** differentiates itself by targeting **smaller cities** and prioritizing **verified, trustworthy local professionals** over sheer platform size.

**Example use case:**

A user searches:

```
"AC servicing near Sonadanga"
```

The system returns nearby, ranked results:

| Provider          | Rating | Starting Price | Distance |
|--------------------|:------:|:---------------:|:--------:|
| Rahim AC Service    | 4.8 ⭐  | ৳500            | 1.2 km   |
| CoolTech            | 4.6 ⭐  | ৳600            | 2.1 km   |

The user then books a service directly through the platform.

---

## Key Features

- 👤 **Provider Profiles** — Bios, skills, service categories, portfolios, and pricing.
- ⭐ **Ratings & Reviews** — Verified, post-service customer feedback.
- 📍 **Location-Based Search** — Find providers by category and proximity.
- 📅 **Booking System** — Request, confirm, and manage service appointments.
- 🗂️ **Service Categories** — Electricians, plumbers, AC techs, mechanics, and more.
- 💰 **Price Estimates** — Transparent starting prices before booking.
- 🕒 **Availability Calendar** — Providers manage their own working hours.
- 📜 **Job History** — Full booking history for both customers and providers.
- ✅ **Provider Verification** — Admin-reviewed document verification with a "Verified" badge.

---

## Tech Stack

| Layer            | Technology                                              |
|-------------------|----------------------------------------------------------|
| **Frontend**       | React.js, Tailwind CSS                                   |
| **Backend**        | Node.js, Express.js                                      |
| **Database**       | MongoDB (primary) / MySQL (alternative)                  |
| **Authentication**  | JWT, bcrypt                                               |
| **Location Services** | Google Maps API / OpenStreetMap + Geolocation API      |
| **Notifications**  | Nodemailer (email), SMS Gateway                          |
| **Hosting**        | Vercel / Netlify (frontend), Render / Railway (backend), MongoDB Atlas (DB) |
| **Testing**         | Jest, React Testing Library, Postman                      |
| **Version Control** | Git & GitHub                                              |

---

## Project Structure

```
local-services-marketplace/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/        # API calls
│   │   └── App.jsx
│   └── package.json
│
├── server/                  # Node/Express backend
│   ├── config/               # DB & environment config
│   ├── controllers/
│   ├── middleware/           # Auth, error handling
│   ├── models/                # MongoDB/MySQL schemas
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── docs/                     # SRS, diagrams, API docs
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) `v18.x` or later
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) account)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/local-services-marketplace.git
   cd local-services-marketplace
   ```

2. **Install backend dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../client
   npm install
   ```

### Environment Variables

Create a `.env` file inside the `server/` directory using `.env.example` as a template:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Maps & Location
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Notifications
EMAIL_HOST=smtp.example.com
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
SMS_API_KEY=your_sms_gateway_key
```

> ⚠️ **Never commit your `.env` file.** Ensure it is listed in `.gitignore`.

### Running the App

**Start the backend server:**

```bash
cd server
npm run dev
```

**Start the frontend (in a separate terminal):**

```bash
cd client
npm run dev
```

The app should now be running at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Usage Example

```bash
# Example: search for AC service providers near a location
GET /api/providers/search?category=ac-service&location=Sonadanga
```

**Sample Response:**

```json
{
  "results": [
    {
      "id": "64f1a2...",
      "name": "Rahim AC Service",
      "category": "AC Technician",
      "rating": 4.8,
      "startingPrice": 500,
      "distanceKm": 1.2,
      "verified": true
    },
    {
      "id": "64f1a3...",
      "name": "CoolTech",
      "category": "AC Technician",
      "rating": 4.6,
      "startingPrice": 600,
      "distanceKm": 2.1,
      "verified": true
    }
  ]
}
```

---

## API Overview

| Method | Endpoint                     | Description                             | Auth Required |
|--------|-------------------------------|------------------------------------------|:--------------:|
| POST   | `/api/auth/register`          | Register a new customer or provider      | ❌              |
| POST   | `/api/auth/login`             | Authenticate and receive a JWT           | ❌              |
| GET    | `/api/providers/search`       | Search providers by category & location  | ❌              |
| GET    | `/api/providers/:id`          | Get a single provider's profile          | ❌              |
| POST   | `/api/providers/:id/verify`   | Approve/reject provider verification     | ✅ (Admin)      |
| POST   | `/api/bookings`               | Create a new booking request             | ✅ (Customer)   |
| PATCH  | `/api/bookings/:id/status`    | Update booking status                     | ✅              |
| POST   | `/api/reviews`                | Submit a rating/review                    | ✅ (Customer)   |
| GET    | `/api/users/:id/history`      | Get booking/job history                  | ✅              |

> Full endpoint documentation is available in [`docs/`](./docs).

---

## Testing

Run the test suite from each respective directory:

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

API endpoints can also be tested manually using the provided [Postman collection](./docs/postman_collection.json).

---

## Roadmap

- [x] Provider & customer registration and authentication
- [x] Location-based search and filtering
- [x] Booking system with availability calendar
- [x] Ratings and reviews
- [x] Admin verification dashboard
- [ ] Integrated online payment gateway
- [ ] In-app real-time chat between customer and provider
- [ ] Native mobile apps (iOS/Android)
- [ ] AI-based provider recommendations

See open [issues](../../issues) for a full list of proposed features and known bugs.

---

## Team

| Member                     | Role                                                              |
|------------------------------|---------------------------------------------------------------------|
| **Nayon Mondol**             | Team Lead · Backend Developer · Database Administrator              |
| **Alakananda Chakrabartty**  | Frontend Developer · UI/UX Designer · QA Tester                     |

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m "Add: your feature description"`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

Please make sure your code follows the existing style conventions and includes relevant tests before submitting.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgements

- [React](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Maps Platform](https://developers.google.com/maps)
