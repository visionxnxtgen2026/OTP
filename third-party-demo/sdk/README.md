# DDS Auth SDK

Official server-side Node.js SDK for integrating DDS mobile verification into merchant and third-party backend servers.

## Installation / Usage
```javascript
import { DDSAuth } from './sdk/index.js'

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID,
  clientSecret: process.env.DDS_CLIENT_SECRET,
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
})

// Request mobile verification
const challenge = await dds.verification.request({
  mobileId: '+918637628773',
  origin: 'http://localhost:5175'
})

// Check verification status
const status = await dds.verification.status(challenge.requestId)
```
