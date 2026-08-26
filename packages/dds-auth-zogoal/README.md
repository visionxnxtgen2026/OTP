# DDS Auth

**Secure. Verify. Trust.**

By [Zogoal](https://zogoal.com)

---

## Installation

```bash
npm install dds-auth-zogoal
```

That's it. Installation automatically configures DDS Auth integration for both your **React frontend** and **Node.js backend**.

---

## What happens after `npm install`

The package detects your project structure and generates:

### Frontend (`src/integrations/dds/`)
```
src/integrations/dds/
├── DDSVerification.jsx     ← Drop-in verification modal
└── index.js                ← Barrel export
```

### Backend (`src/integrations/` + `src/routes/`)
```
src/integrations/dds.js                     ← DDSAuth client
src/routes/ddsVerification.routes.js        ← Express routes
.env.example                                ← Environment template
```

---

## Frontend Usage

```jsx
import { DDSVerification } from './src/integrations/dds/index.js'

function Checkout() {
  return (
    <DDSVerification
      merchantApiUrl="http://localhost:5001"
      onSuccess={(requestId) => console.log('Verified:', requestId)}
    />
  )
}
```

Or import directly from the package:

```jsx
import { DDSProvider, DDSVerificationButton, useDDSVerification } from 'dds-auth-zogoal/react'
```

---

## Backend Usage

```js
// server.js / app.js
import { ddsVerificationRouter } from './src/routes/ddsVerification.routes.js'
app.use('/api/dds/verification', ddsVerificationRouter)
```

Or use the SDK directly:

```js
import { DDSAuth } from 'dds-auth-zogoal/server'

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID,
  clientSecret: process.env.DDS_CLIENT_SECRET,
  baseURL: process.env.DDS_AUTH_URL
})

const result = await dds.verification.request({
  mobileId: '+918637628773',
  origin: 'http://localhost:5175'
})
```

---

## Environment Variables

Add to your backend `.env`:

```env
DDS_AUTH_URL=http://localhost:5000
DDS_CLIENT_ID=dds_client_xxxxx
DDS_CLIENT_SECRET=dds_secret_xxxxx
```

> ⚠️ **Never expose `DDS_CLIENT_SECRET` in frontend code.**

Get credentials from the [DDS Developer Portal](http://localhost:5174).

---

## Verification Flow

```
User clicks DDSVerificationButton
        ↓
Frontend → POST /api/dds/verification/request → Backend
        ↓
Backend → DDS Auth API → Creates verification request
        ↓
User receives request in DDS User App → Approves
        ↓
Frontend polls GET /api/dds/verification/status/:requestId
        ↓
Status = "verified" → onSuccess callback fires
```

---

## Manual Setup

If automatic setup is skipped (e.g. CI), run:

```bash
npx dds-auth-zogoal
```

To skip postinstall:

```bash
DDS_SKIP_POSTINSTALL=1 npm install dds-auth-zogoal
```

---

## Package Exports

| Import | Contents |
|--------|----------|
| `dds-auth-zogoal/react` | `DDSProvider`, `DDSVerificationButton`, `useDDSVerification`, `DDSStatusBadge` |
| `dds-auth-zogoal/server` | `DDSAuth`, error classes, TypeScript types |

---

## License

MIT — Zogoal DDS Team
