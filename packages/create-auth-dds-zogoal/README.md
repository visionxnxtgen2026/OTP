# create-auth-dds-zogoal

> One-command developer integration CLI for DDS Auth — by Zogoal.

[![npm version](https://img.shields.io/npm/v/create-auth-dds-zogoal.svg)](https://www.npmjs.com/package/create-auth-dds-zogoal)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

Integrate DDS Auth into any existing React and Node/Express application with a single command:

```bash
npx create-auth-dds-zogoal
```

## ✨ Features

- **Zero Manual Setup**: Installs and configures DDS packages automatically.
- **Smart Project Detection**: Detects React, Vite, Next.js, Express, TypeScript, and monorepo folders.
- **Frontend Scaffolding**: Generates `<DDSProvider />` and official `<DDSVerificationButton />` UI components.
- **Backend Scaffolding**: Generates DDS client initialization and Express verification challenge routes.
- **Environment Protection**: Sets up `.env.example` templates and keeps secrets protected from browser code.
- **Built-in Diagnostics**: Run `npx create-auth-dds-zogoal doctor` to audit your integration health.

## 📦 Usage

### 1. Run Scaffolding
```bash
npx create-auth-dds-zogoal
```

### 2. Add Credentials
Copy your **Client ID** and **Client Secret** from the [DDS Developer Portal](http://localhost:5174) into your `.env` file:
```env
DDS_AUTH_URL=http://localhost:5000
DDS_CLIENT_ID=dds_client_xxxxxxxx
DDS_CLIENT_SECRET=dds_secret_xxxxxxxx
```

### 3. Run Doctor Command
```bash
npx create-auth-dds-zogoal doctor
```

## 📄 License
MIT © Zogoal
