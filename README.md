# VaultStock API

Backend API for the [VaultStock Investment Platform](https://stock-portfolio-ruby-five.vercel.app), built with **Next.js 16** (App Router) and **MongoDB**.

## 🚀 Quick Links
- **API Base URL**: `https://stockinvest-api.vercel.app` (Production)
- **Local Dev**: `http://localhost:3000`
- **Version**: 2.0.0

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
  totalBalance, availableCash
}
```

### Investment (Holdings)
```ts
Investment {
  id, assetId, symbol, name, shares, avgPrice, currentPrice,
  value, change, changePercent, purchaseDate,
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

### Reference Types
```ts
LocationData { [country]: { [state]: string[] } }
GenderOption { label: string, value: string }
```

---

## 🧪 How to Test (Step-by-Step)

### 1. Base URL
All requests should be prefixed with:
*   **Production**: `https://stockinvest-api.vercel.app`
*   **Local**: `http://localhost:3000`

### 2. Public Market Data (No Auth Required)
You can test these directly in your browser or Postman.
*   **List Stocks**: `GET /api/market/stocks?sector=Technology`
*   **Search All Assets**: `GET /api/market/search?q=gold`
*   **Screener Stats**: `GET /api/market/screener`
*   **Locations**: `GET /api/reference/locations`
*   **Genders**: `GET /api/reference/genders`

### 3. Authenticated Testing (JWT Required)
Most user and admin routes require an `Authorization` header.

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

### 4. Testing the Onboarding Journey

#### Option A: Unified KYC (Recommended) — **Public**
Submit all KYC data in a single request. (No token required, uses `email` to identify the user).
```bash
curl -X POST https://stockinvest-api.vercel.app/api/onboarding/kyc \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePass123",
    "sex": "male",
    "idType": "passport",
    "country": "United States",
    ...
  }'
```

#### Option B: Step-by-Step (Legacy)
1.  **Check Progress**: `GET /api/onboarding/status`
2.  **Submit Step 7 (Sex/Password)**: `POST /api/onboarding/step7`
3.  **Submit Step 8-15**: Continue through individual endpoints

### 5. Get Full User Profile
```bash
curl https://stockinvest-api.vercel.app/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```
Returns the nested `User` object with `profile`, `settings`, `portfolios`, `cashMovements`, `connectedAccounts`, `stockTransfers`, `totalBalance`, `availableCash`.

### 6. Admin Testing
To test admin features, log in with an admin account and use the same `Bearer` header for:
*   **Approve User**: `POST /api/admin/onboarding/approve`
*   **List Requests**: `GET /api/admin/requests`

---

## 📋 Comprehensive API Documentation

### 🛡️ Authentication & Initial Setup

#### 1. Public Account Request (Step 1)
Users request an account, which goes to "pending" status. Password is NOT collected here.
*   **Method:** `POST /api/auth/register`
*   **Body (JSON):**
    *   `firstName` (String, Required)
    *   `lastName` (String, Required)
    *   `email` (String, Required) - Must be unique
    *   `phone` (String, Optional)
    *   `message` (String, Optional)

#### 2. Admin Setup / Direct User Creation
Used by developers or admins to instantly create a fully approved user/admin.
*   **Method:** `POST /api/auth/setup`
*   **Body (JSON):**
    *   `firstName` (String, Required)
    *   `lastName` (String, Required)
    *   `email` (String, Required) - Must be unique
    *   `password` (String, Required)

#### 3. Standard Login
*   **Method:** `POST` or `GET` `/api/auth/login`
*   **Payload:** `{ email, password }`
*   **Returns:** JWT Token + enriched user object (id, email, firstName, lastName, role, status, isApproved, isKyc, accountStatus, investorCode, accountCategory, accountType, kycStatus, kycVerified, riskTolerance, baseCurrency, agreementSigned, onboardingStep, country, avatar)

#### 4. Get Current User (Full Nested Profile)
*   **Method:** `GET /api/auth/me`
*   **Auth:** Bearer Token
*   **Returns:** Nested `User` object with `profile`, `settings` (including `isApproved`, `isKyc`, `accountStatus`), `portfolios`, `cashMovements`, `connectedAccounts`, `stockTransfers`, `totalBalance`, `availableCash`

#### 5. Authentication & KYC State Flow
Frontend should use the following flags to determine the user's journey:
*   **`isApproved`**: `true` if the admin has approved the initial account request (Status: `approved` or `onboarding`).
*   **`isKyc`**: `true` if the user has completed all onboarding/KYC steps (OnboardingStep >= 16).
*   **`accountStatus`**: `active` (Fully approved), `pending` (Under review), `rejected`, or `suspended`.

**Routing Logic:**
- If `isApproved` matches `true` AND `isKyc` matches `false` → Route to `/onboarding`.
- If `isApproved` matches `true` AND `isKyc` matches `true` AND `accountStatus` matches `pending` → Show "Account Under Review".
- If `accountStatus` matches `active` → Access Dashboard.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/setup` | Create initial admin/approved user | None |
| POST | `/api/auth/register` | Initial account request (Step 1) | None |
| POST/GET | `/api/auth/login` | Sign in & get JWT Token | None |
| GET | `/api/auth/me` | Get full nested user profile | Bearer |
| POST | `/api/auth/forgot-password` | Request password reset email | None |
| POST | `/api/auth/reset-password` | Set new password with token | None |

#### 5. User Data (Unified)
*   **Method:** `GET /api/user/data`
*   **Auth:** Bearer Token
*   **Returns:** `{ Portfolio, Investment, Transaction }`
    *   **Portfolio**: List of user portfolios and their holdings.
    *   **Investment**: Flat list of all current holdings with live pricing.
    *   **Transaction**: History of deposits, withdrawals, buys, and sells.

#### 6. Authentication & KYC State Flow
...

### 🚀 Onboarding Journey

#### Unified KYC Onboarding (New)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding/kyc` | **Unified** — submit all KYC data in one request |

**Payload:**
```json
{
  "email": "", "password": "", "sex": "", "idType": "", "country": "",
  "houseNumber": "", "street": "", "city": "", "state": "", "zipCode": "",
  "poaType": "",
  "nomineeName": { "first": "", "middle": "", "last": "" },
  "nomineeRelationship": "", "nomineeAddressSame": true,
  "partner": "", "agreementAccepted": false
}
```

#### Step-by-Step Onboarding (Legacy — still supported)
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

### 📊 Market Screener (DB Powered)
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

### 🏦 Portfolio & Investment Management
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

### 🌍 Reference Data
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reference/locations` | Country → State → Cities data | None |
| GET | `/api/reference/genders` | Gender options (label + value) | None |

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
| PUT | `/api/admin/requests/:id` | Approve/Reject Step 1 request (Triggers KYC Email) | Admin |
| GET | `/api/admin/users` | Manage all registered users | Admin |
| GET/PUT/DEL| `/api/admin/users/:id` | Manage specific user | Admin |
| GET | `/api/admin/kyc` | List all users and their KYC documents | Admin |
| GET/POST | `/api/admin/market/stocks` | Manage market data (Stock creation/editing) | Admin |
| GET/PUT | `/api/admin/settings` | Manage site configuration (Maintenance mode, etc) | Admin |
| POST | `/api/admin/onboarding/approve`| Final approve: Generates **Investor Code**| Admin |
| POST | `/api/admin/onboarding/reject-document`| Reject specific ID/Address files | Admin |

### 📧 Automated Notifications (Simulated)
The API includes a simulation layer for email communications (see `lib/mail.ts`). 
1. **KYC Onboarding Link**: When an admin approves an account request, the user receives an email with a link to `http://localhost:3000/onboarding` (local) or your Production Vercel URL.
2. **Approval & Investor Code**: Once final KYC is approved, a welcome email is "sent" with the user's unique Investor Code.

---

## 🚀 Deployment
Deployed on Vercel. Database is hosted on MongoDB Atlas.
CI/CD is triggered on every push to `master`.

---
## 📄 License
MIT
