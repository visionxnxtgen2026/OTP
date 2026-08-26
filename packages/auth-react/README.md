# DDS Auth React SDK (`@dds/auth-react`)

Official React frontend integration hooks and components for **DDS Mobile Verification**.

> **SECURITY NOTE**: This frontend React package connects **only** to your merchant backend API and **never** requires or accepts your `DDS_CLIENT_SECRET`.

## Installation

```bash
npm install @dds/auth-react
```

## Quick Start

### 1. Using the `useDDSVerification` Hook

```tsx
import React, { useState } from 'react';
import { useDDSVerification, DDSStatusBadge } from '@dds/auth-react';

export function CheckoutForm() {
  const [mobileNumber, setMobileNumber] = useState('8637628773');

  const {
    status,
    verificationCode,
    countdown,
    error,
    loading,
    isVerified,
    isPending,
    initiateVerification,
    reset
  } = useDDSVerification({
    merchantApiUrl: 'https://api.yourstore.com',
    onSuccess: (requestId) => {
      console.log('User verified with request ID:', requestId);
    }
  });

  return (
    <div className="checkout-card">
      <DDSStatusBadge status={status} />

      {status === 'idle' && (
        <div>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Mobile Number"
          />
          <button onClick={() => initiateVerification(mobileNumber)}>
            Verify with DDS
          </button>
        </div>
      )}

      {isPending && (
        <div className="challenge-box">
          <p>Enter this 6-digit code in your DDS App:</p>
          <h2>{verificationCode}</h2>
          <p>Expires in {countdown}s</p>
        </div>
      )}

      {isVerified && (
        <div className="success-box">
          <h3>Verification Complete!</h3>
        </div>
      )}
    </div>
  );
}
```

## License
MIT
