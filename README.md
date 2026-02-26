# VaultStock API

Backend API for the [VaultStock Investment Platform](https://stock-portfolio-ruby-five.vercel.app), built with **Next.js 16** (App Router) and **MongoDB**.

## 🚀 Quick Links
- **API Base URL**: `https://stockinvest-api.vercel.app` (Production)
- **Local Dev**: `http://localhost:3000`

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (Stateless) + bcryptjs
- **Seeding Tool**: tsx
- **Hosting**: Vercel

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local`:
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas Connection String |
| `JWT_SECRET` | Secret key for JWT |
| `FRONTEND_URL` | e.g. `http://localhost:3001` (for CORS) |

### 3. Seed the Database
Populate MongoDB with the mock financial dataset (Stocks, Bonds, ETFs, etc.):
```bash
npm run seed
```

---

## 📋 Comprehensive API Documentation

### 🛡️ Authentication & Initial Setup
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/setup` | Create initial admin (one-time) | None |
| POST | `/api/auth/register` | Initial account request (Step 1) | None |
| POST | `/api/auth/login` | Sign in & get JWT Token | None |
| GET | `/api/auth/me` | Get current user's full profile | Bearer |

### 🚀 Onboarding Journey (Steps 7-15)
Ensures users never restart; progress is auto-saved.
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/onboarding/status` | Get current progress & auto-recovery data |
| POST | `/api/onboarding/step7` | Set Password & Sex (Male/Female) |
| POST | `/api/onboarding/step8` | Identity Verification (ID Upload) |
| POST | `/api/onboarding/step9` | Address Verification (Address + PoA) |
| POST | `/api/onboarding/step10` | Account Nominee (Inheritance Details) |
| POST | `/api/onboarding/step11-12` | Fund Distribution & Settlement Account |
| POST | `/api/onboarding/step13-14` | FS Service Agreement & Signature |
| POST | `/api/onboarding/step15` | Selfie/Headshot & Submit for Review |

### � Market Screener (DB Powered)
Rich financial data served from MongoDB with powerful search and filters.
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/screener` | Market overview, stats, gainer/loser counts |
| GET | `/api/market/search?q=...` | Global search across ALL asset classes |
| GET | `/api/market/stocks` | Stocks listing with sector/trend filters |
| GET | `/api/market/stocks/:symbol` | Single stock detailed data |
| GET | `/api/market/bonds` | Bonds (Government, Corporate, etc.) |
| GET | `/api/market/etfs` | ETFs with index/managed filters |
| GET | `/api/market/mutual-funds` | Mutual Funds with fund family filters |
| GET | `/api/market/commodities` | Commodities (Gold, Oil, Agriculture) |

### 🏦 Portfolio & Investment Management (Real)
Manage real user assets once account is approved.
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Main dashboard (Locked status for unapproved) | User |
| GET | `/api/portfolios` | List all user portfolios | Approved |
| POST | `/api/portfolios` | Create a new portfolio | Approved |
| GET | `/api/portfolios/:id` | Get portfolio details | Approved |
| GET | `/api/portfolios/:id/holdings`| List holdings in a specific portfolio | Approved |
| POST | `/api/portfolios/:id/holdings`| Add an investment to a portfolio | Approved |
| GET/PUT/DEL| `/api/portfolios/:id/holdings/:hid`| Manage specific holding | Approved |
| GET | `/api/investments` | Aggregated view of ALL assets | Approved |

### 💸 Funds & Transfers
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/funds` | Balance summary and transaction history | Approved |
| POST | `/api/funds` | Initiate deposit/withdrawal | Approved |
| GET/POST | `/api/funds/payment-methods`| Manage saved payment methods | Approved |
| GET | `/api/transfers` | List sent/received portfolio transfers | Approved |
| POST | `/api/transfers` | Initiate a portfolio transfer | Approved |
| GET | `/api/transfers/:id` | View specific transfer details | Approved |

### 👤 Profile & Security
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/PUT | `/api/profile` | Update profile information | User |
| PUT | `/api/profile/password` | Change user password | User |
| GET/POST | `/api/profile/kyc` | Manage KYC status data | User |
| GET/POST | `/api/profile/agreement`| View/Sign legal agreements | User |

### 🧪 Mock Data Endpoints (For Demos)
Returns static data from the `user-data.ts` mock file.
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mock/user` | Rich profile dummy data |
| GET | `/api/mock/user/portfolios` | Dummy portfolios |
| GET | `/api/mock/user/portfolios/:id`| Dummy portfolio details |
| GET | `/api/mock/user/transactions` | Dummy transaction history |

### ⚡ Admin & Moderation
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Admin overview stats | Admin |
| GET | `/api/admin/requests` | List account requests (Step 1) | Admin |
| PUT | `/api/admin/requests/:id` | Approve/Reject Step 1 request | Admin |
| GET | `/api/admin/users` | Manage all registered users | Admin |
| GET/PUT/DEL| `/api/admin/users/:id` | Manage specific user | Admin |
| POST | `/api/admin/onboarding/approve`| Final approve: Generates **Investor Code**| Admin |
| POST | `/api/admin/onboarding/reject-document`| Reject specific ID/Address files | Admin |

---

## 🚀 Deployment
Deployed on Vercel. Database is hosted on MongoDB Atlas.
CI/CD is triggered on every push to `master`.

---
## 📄 License
MIT
