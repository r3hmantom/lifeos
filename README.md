# LifeOS

Personal life-operating system with a web app, mobile app, and backend API in one monorepo.

## Structure

```
lifeos/
├── apps/
│   ├── web/      # Vite + React + TypeScript
│   ├── mobile/   # Expo / React Native
│   └── api/      # Express + Prisma
└── README.md
```

| Path | Stack |
|------|-------|
| `apps/web` | React, TypeScript, Vite, shadcn/ui |
| `apps/mobile` | Expo, React Native, TypeScript |
| `apps/api` | Node.js, Express, Prisma |

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- For mobile: Expo CLI / Android Studio or Xcode
- For API: Postgres and the env vars expected by `apps/api`

## Run each app

Apps are independent — install and run from each package directory.

### API (`apps/api`)

```bash
cd apps/api
npm install
# Configure DATABASE_URL and other secrets (e.g. .env)
npx prisma generate
npm run dev
```

### Web (`apps/web`)

```bash
cd apps/web
npm install
npm run dev
```

### Mobile (`apps/mobile`)

```bash
cd apps/mobile
npm install
npm start
```
