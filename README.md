# DDS Auth Platform — Monorepo Architecture

A secure, mobile-first verification and identity platform built with end-to-end cryptographic challenge validation and strict session gating.

---

## 1. System Architecture

```text
                    DDS PRODUCT ECOSYSTEM
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   dds-auth-backend       user-app         developer-portal
    (Node + Express)    (React + TS)         (React + TS)
      Port: 5000         Port: 5173           Port: 5174
      [0.0.0.0]           [0.0.0.0]            [0.0.0.0]
        │                    ▲                    ▲
        ▼                    │ (Socket.IO + API)  │ (HTTP API)
     MongoDB                 └────────────────────┘
   (dds_auth)
  Port: 27017
 [127.0.0.1 PRIVATE]

              EXTERNAL THIRD-PARTY / CUSTOMER
                             │
                      third-party-demo
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
            frontend                    backend
          (React + TS)              (Node + Express)
           Port: 5175                  Port: 5001
           [0.0.0.0]                   [0.0.0.0]
               │                           │
               └───────── HTTP ────────────┤
                                           │ (DDS Auth SDK)
                                           ▼
                                    dds-auth-backend
                                       Port: 5000
```

---

## 2. Port Allocation & Public Forwarding Table

| Service | Port | Network Binding | Public Forwarding | Description |
| :--- | :---: | :---: | :---: | :--- |
| **DDS Auth Backend** | `5000` | `0.0.0.0` | **Yes** | Core Authentication & Verification API + Socket.IO |
| **Third-Party Backend** | `5001` | `0.0.0.0` | **Yes** | DemoShop Merchant Backend with DDS SDK |
| **DDS User App** | `5173` | `0.0.0.0` | **Yes** | Mobile Web App for User Authentication & Approvals |
| **Developer Portal** | `5174` | `0.0.0.0` | **Yes** | Developer Console for App Registration & Logs |
| **Third-Party Frontend** | `5175` | `0.0.0.0` | **Yes** | DemoShop Merchant E-Commerce Checkout Store |
| **MongoDB** | `27017` | `127.0.0.1` | **NO (PRIVATE)** | Internal Database (Never exposed publicly) |

---

## 3. Directory Layout

```text
google/
│
├── dds-auth-backend/         # DDS Core Authentication & Verification API (:5000)
│   ├── src/
│   │   ├── controllers/      # Auth, Developer, Verification controllers
│   │   ├── middleware/       # Session & Client auth middlewares
│   │   ├── models/           # Mongoose models (User, Application, Session, etc.)
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Socket.IO service & event handlers
│   │   ├── utils/            # E.164 phone normalizer
│   │   └── server.js         # Entrypoint (0.0.0.0:5000)
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── user-app/                 # DDS User Identity & Verification Web App (:5173)
│   ├── src/
│   │   ├── components/       # Auth layouts, modals, dashboards
│   │   ├── services/         # HTTP API & Socket.IO client
│   │   └── App.tsx
│   ├── .env
│   ├── .env.example
│   ├── vite.config.ts        # 0.0.0.0:5173 (strictPort: true)
│   └── package.json
│
├── developer-portal/         # DDS Administrative & Developer Console (:5174)
│   ├── src/
│   │   ├── components/       # Applications, Credentials, Audit logs
│   │   ├── services/         # Developer management API
│   │   └── App.tsx
│   ├── .env
│   ├── .env.example
│   ├── vite.config.ts        # 0.0.0.0:5174 (strictPort: true)
│   └── package.json
│
├── third-party-demo/         # External Merchant Demo Application (DemoShop)
│   │
│   ├── frontend/             # DemoShop Storefront (:5175)
│   │   ├── src/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── vite.config.ts    # 0.0.0.0:5175 (strictPort: true)
│   │   └── package.json
│   │
│   └── backend/              # DemoShop Merchant Backend (:5001)
│       ├── server.js         # Entrypoint (0.0.0.0:5001)
│       ├── .env              # Stores DDS_CLIENT_SECRET securely
│       ├── .env.example
│       └── package.json
│
├── packages/                 # Reusable NPM Packages
│   ├── auth-sdk/             # @dds/auth-sdk (Node.js SDK)
│   └── auth-react/           # @dds/auth-react (React SDK)
│
├── package.json
├── README.md
└── .gitignore
```

---

## 4. Development Commands

### Start all 5 services simultaneously:
```bash
npm run dev
```

### Individual Service Commands:
```bash
# DDS Core Services
npm run dev:auth              # DDS Auth Backend (:5000)
npm run dev:user              # DDS User App (:5173)
npm run dev:portal            # Developer Portal (:5174)

# Third-Party DemoShop
npm run dev:third-party-api   # DemoShop Backend (:5001)
npm run dev:third-party-web   # DemoShop Frontend (:5175)
```

### Build & Package Validation:
```bash
npm run build                 # Builds all packages and frontend bundles
npm run pack:check            # Validates npm tarball artifacts without secret leakage
```
