# DemoShop Backend

The merchant backend service for DemoShop.

## Responsibilities
- Interfaces between DemoShop React Frontend and DDS Auth SDK
- Securely stores the merchant's DDS Client Secret
- Validates credential health with DDS Auth on startup
- Initiates verification challenges and polls verification statuses

## Security Rules
- The **DDS Client Secret exists ONLY here** in `.env`.
- It is **never** sent to DemoShop React frontend or exposed to the browser.
- Does **not** connect directly to MongoDB (communicates strictly via DDS Auth SDK / HTTP).

## Port
`http://localhost:5001`

## Run
```bash
npm run dev
```
