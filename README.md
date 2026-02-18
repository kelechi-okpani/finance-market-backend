# VaultStock API

Backend API for the [VaultStock Investment Platform](https://stock-portfolio-ruby-five.vercel.app), built with **Next.js 16** (App Router) and **MongoDB**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, API only) |
| Language | TypeScript |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Stock Data | MarketStack API |
| Hosting | Vercel |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/ekenmapeter/stockinvest_api.git
cd stockinvest_api
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (e.g. MongoDB Atlas) |
| `JWT_SECRET` | Secret key for JWT token signing |
| `MARKETSTACK_API_KEY` | MarketStack API key for stock data |
| `FRONTEND_URL` | Frontend URL for CORS whitelist |

### 3. Run Development Server

```bash
npm run dev
```

API will be available at `http://localhost:3000`

### 4. Initial Setup

Create the first admin account by sending a POST request:

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Admin","lastName":"User","email":"admin@example.com","password":"your_password"}'
```

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API info & endpoint listing |

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/setup` | Create initial admin (one-time) | None |
| POST | `/api/auth/register` | Request an account | None |
| POST | `/api/auth/login` | Sign in, get JWT token | None |
| GET | `/api/auth/me` | Get current user profile | Bearer |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Dashboard stats | Admin |
| GET | `/api/admin/requests` | List account requests | Admin |
| PUT | `/api/admin/requests/:id` | Approve/reject request | Admin |
| GET | `/api/admin/users` | List all users | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |

### Coming Soon
- Portfolio management
- Market data (MarketStack)
- Investment monitoring
- Funds management
- Portfolio transfers
- Profile & settings

## Deployment

This project is configured for **Vercel** deployment. Push to the GitHub repo and connect it to Vercel. Set the environment variables in Vercel's dashboard.

## License

MIT
