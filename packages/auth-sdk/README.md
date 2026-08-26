# DDS Auth SDK (`@dds/auth-sdk`)

Official Node.js SDK for integrating **DDS Mobile Verification** into third-party web & mobile backends.

## Installation

```bash
npm install @dds/auth-sdk
```

## Setup & Configuration

Add your application credentials in your server environment:

```env
DDS_CLIENT_ID=dds_client_your_id
DDS_CLIENT_SECRET=dds_secret_your_secret
DDS_AUTH_URL=https://api.dds.example.com
```

## Quick Start

```typescript
import { DDSAuth, MobileNotRegisteredError, InvalidCredentialsError } from '@dds/auth-sdk';

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID,
  clientSecret: process.env.DDS_CLIENT_SECRET,
  baseURL: process.env.DDS_AUTH_URL
});

// 1. Initiate a verification challenge
try {
  const challenge = await dds.verification.request({
    mobileId: '+918637628773',
    origin: 'https://yourmerchant.com'
  });

  console.log(challenge.requestId);        // e.g. "req_8f92k1"
  console.log(challenge.verificationCode); // 6-digit challenge code to display on checkout screen
} catch (err) {
  if (err instanceof MobileNotRegisteredError) {
    console.error('Customer has not registered with DDS yet.');
  }
}

// 2. Poll / Query verification status
const status = await dds.verification.status('req_8f92k1');
if (status.status === 'verified') {
  console.log('User identity confirmed by DDS!');
}
```

## Typed Errors
- `DDSAuthError`
- `InvalidCredentialsError`
- `ApplicationRevokedError`
- `ApplicationDisabledError`
- `OriginNotAllowedError`
- `MobileNotRegisteredError`
- `VerificationExpiredError`
- `VerificationAlreadyCompletedError`
- `RateLimitError`
- `DDSNetworkError`

## License
MIT
