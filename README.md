# VaultStock API

Backend API for the [VaultStock Investment Platform](https://stock-portfolio-ruby-five.vercel.app), built with **Next.js 16** (App Router) and **MongoDB**.

## 🚀 Quick Links
- **API Base URL**: `https://stockinvest-api.vercel.app` (Production)
- **Local Dev**: `http://localhost:3000`
- **Version**: 2.1.0

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

## 📦 Data Models

### User
```ts
User {
  id, profile: { firstName, lastName, email, avatar, address, country, phoneNumber },
  settings: { accountType, kycStatus, riskTolerance, baseCurrency, isApproved, isKyc, accountStatus },
  portfolios: [{ id, name, holdings: Investment[] }],
  cashMovements: CashMovement[],
  connectedAccounts: ConnectedAccount[],
  stockTransfers: StockTransfer[],
  totalBalance, availableCash,
  failedWithdrawalAttempts, requiresResettlementAccount
}
```

### Investment (Holdings)
```ts
Investment {
  id, assetId, symbol, name, sector, shares, avgPrice, currentPrice,
  value, change, changePercent, purchaseDate,
  market, price, volume, marketCap, peRatio, dividend, marketTrend, description,
  portfolioType: "Growth" | "Retirement" | "Aggressive",
  performanceHistory: { date, value, gain }[]
}
```

### CashMovement (Deposit / Withdrawal)
```ts
CashMovement {
  id, type: "deposit" | "withdrawal",
  amount, currency, method, status, date
}
```

### ConnectedAccount (External Linked Accounts)
```ts
ConnectedAccount {
  id, provider, accountName, lastFour, balance
}
```

### StockTransfer
```ts
StockTransfer {
  id, assetSymbol, assetName, shares, valueAtTransfer,
  fromUser, toUser, date,
  status: "completed" | "pending" | "rejected",
  type: "inbound" | "outbound"
}
```

### Asset (Market Data — Unified)
```ts
Asset {
  id, symbol, name, price, change, changePercent, volume,
  type?, marketCap?, yield?, expiry?, strike?,
  openInterest?, sector?
}
```

---

## 🧪 How to Test (Step-by-Step)

### 1. Base URL
All requests should be prefixed with:
*   **Production**: `https://stockinvest-api.vercel.app`
*   **Local**: `http://localhost:3000`

### 2. Public Market Data (No Auth Required)
*   **List Stocks**: `GET /api/market/stocks?sector=Technology`
*   **Search All Assets**: `GET /api/market/search?q=gold`
*   **Screener Stats**: `GET /api/market/screener`
*   **Locations**: `GET /api/reference/locations`
*   **Genders**: `GET /api/reference/genders`

### 3. Authenticated Testing (JWT Required)
#### **Step A: Login and get a Token**
```bash
curl -X POST https://stockinvest-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"yourpassword"}'
```
*Response will contain a `token`. Copy it.*

#### **Step B: Use Token in Header**
Include the token in all subsequent requests:
`Authorization: Bearer <YOUR_TOKEN_HERE>`

---

## 📋 Comprehensive API Documentation

### 🛡️ Authentication & Profiles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/setup` | Direct setup for initial admin/user | None |
| POST | `/api/auth/register`| Step 1: User requests an account | None |
| POST | `/api/auth/login` | Sign in & get JWT | None |
| GET | `/api/auth/me` | Get full nested user profile | Bearer |
| POST | `/api/auth/forgot-password`| Start password reset flow | None |
| POST | `/api/auth/reset-password`| Finalize password reset | None |
| GET | `/api/profile` | View detailed profile | User |
| PUT | `/api/profile` | Update profile details | User |
| PUT | `/api/profile/password`| Update user password | User |
| GET | `/api/profile/kyc`| Get current KYC status | User |
| GET | `/api/profile/agreement`| View signed agreements | User |
| POST | `/api/profile/agreement`| Sign service agreement | User |

### 🚀 Onboarding & KYC
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding/kyc`| **Unified KYC**: All steps in one request |
| GET | `/api/onboarding/status`| View current journey progress |
| POST | `/api/onboarding/step7`| Set sex and password |
| POST | `/api/onboarding/step8`| Identity Doc Upload |
| POST | `/api/onboarding/step9`| Address & Proof of Address |
| POST | `/api/onboarding/step10`| Nominee Details |
| POST | `/api/onboarding/step11-12`| Settlement & Fund Sources |
| POST | `/api/onboarding/step13-14`| Agreement Signing |
| POST | `/api/onboarding/step15`| Final Photo/Headshot submission |

### 📊 Market Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/screener`| Market trend data & gainer counts |
| GET | `/api/market/search` | Search across stocks/bonds/etfs/funds |
| GET | `/api/market/approved`| List stocks approved for verified users |
| GET | `/api/market/stocks` | List equity stocks with sector filters |
| GET | `/api/market/stocks/:symbol`| Details for a specific equity |
| GET | `/api/market/bonds` | Fixed income securities |
| GET | `/api/market/etfs` | Exchange Traded Funds |
| GET | `/api/market/mutual-funds`| Professionally managed funds |
| GET | `/api/market/commodities`| Raw materials (Gold, Oil, etc.) |

### 🏦 Portfolios & Holdings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | High-level summary of active balance | Approved |
| GET | `/api/portfolios` | List all user portfolios | Approved |
| POST | `/api/portfolios` | Create new portfolio | Approved |
| GET | `/api/portfolios/:id`| Portfolio details & asset list | Approved |
| GET | `/api/portfolios/:id/holdings`| All holdings in a specific portfolio | Approved |
| POST | `/api/portfolios/:id/holdings`| Manual add asset (for imports) | Approved |
| GET | `/api/investments` | Aggregated view of ALL assets | Approved |
| GET | `/api/user/data` | Download complete JSON of user state | Approved |

### 💸 Funds & Stock Transfers
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/funds` | Cash balance & history summary | Approved |
| POST | `/api/funds/deposit`| **Request** Deposit (Pending Admin) | Approved |
| POST | `/api/funds/withdrawal`| **Request** Withdrawal (3-strike fail) | Approved |
| POST | `/api/funds/resettlement`| Apply for Resettlement Account | Approved |
| GET | `/api/cart` | View pending buy/sell items | Approved |
| POST | `/api/cart` | Add stock trade to cart | Approved |
| DELETE | `/api/cart/:id` | Remove item from cart | Approved |
| POST | `/api/cart/checkout`| Submit cart for Admin approval | Approved |
| POST | `/api/transfers/stock`| Transfer specific stock shares to email | Approved |
| POST | `/api/transfers` | Initiate Portfolio Transfer using `portfolioId`, `TransferPayload`, `assetSymbol`, `shares`, `toUserEmail`, `firstName`, `lastName`, `address`, `phone`, `description`. | Approved |
| GET | `/api/transfers` | List sent/received transfer history | Approved |

### ⚡ Admin & Control Center
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard`| Master dashboard overview stats | Admin |
| GET | `/api/admin/overview` | Detailed platform health check | Admin |
| GET | `/api/admin/users` | List all system users | Admin |
| GET | `/api/admin/users/:id/details`| **Audit**: Full user state & history | Admin |
| GET | `/api/admin/requests`| Step 1 account requests queue | Admin |
| PUT | `/api/admin/requests/:id`| Approve Step 1 requests | Admin |
| GET | `/api/admin/transactions`| Queue for deposits/withdrawals | Admin |
| PUT | `/api/admin/transactions/:id`| Process cash movements (Approve/Reject)| Admin |
| GET | `/api/admin/trades` | Queue for buy/sell requests | Admin |
| PUT | `/api/admin/trades/:id`| Execute or Reject stock trades | Admin |
| PUT | `/api/admin/transfers/portfolio/:id`| Portfolio ownership transfer | Admin |
| GET | `/api/admin/kyc` | Queue for document verification | Admin |
| GET | `/api/admin/kyc/:id` | Review specific user documents | Admin |
| POST | `/api/admin/onboarding/approve`| **Final Approval** & Portfolio creation| Admin |
| POST | `/api/admin/onboarding/reject-document`| Flag ID/Proof for re-submission | Admin |
| GET | `/api/admin/market/stocks`| Asset management panel | Admin |
| POST | `/api/admin/market/stocks`| Create/Edit market tickers | Admin |
| PUT | `/api/admin/settings` | Global platform settings | Admin |
| POST | `/api/admin/settings/toggle`| Maintenance mode & toggle switches | Admin |

### 🌍 Infrastructure & Mocks
- **Locations**: `GET /api/reference/locations`
- **Genders**: `GET /api/reference/genders`
- **Mocks**: `/api/mock/user`, `/api/mock/user/portfolios`, `/api/mock/user/transactions` (Static data for frontend dev)

---
## 📄 License
MIT
