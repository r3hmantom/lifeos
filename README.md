# LifeOS

Private monorepo for the LifeOS personal life-operating system — web app, mobile app, and backend API in one place.

## Structure

```
lifeos/
├── apps/
│   ├── web/      # Vite + React + TypeScript (from LifeOS-web)
│   ├── mobile/   # Expo / React Native (from LifeOS-mobile-new)
│   └── api/      # Express + Prisma backend (from lifeos-backend)
└── README.md
```

| Path | Source repo | Stack |
|------|-------------|-------|
| `apps/web` | [LifeOS-web](https://github.com/r3hmantom/LifeOS-web) | React, TypeScript, Vite, shadcn/ui |
| `apps/mobile` | [LifeOS-mobile-new](https://github.com/r3hmantom/LifeOS-mobile-new) | Expo, React Native, TypeScript |
| `apps/api` | [lifeos-backend](https://github.com/r3hmantom/lifeos-backend) | Node.js, Express, Prisma |

Git history from each source repository was preserved via `git filter-repo` + unrelated-history merges.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- For mobile: Expo CLI / Android Studio or Xcode
- For API: Postgres (Prisma) and any env vars from `apps/api` (see package scripts / Prisma schema)

## Run each app

Apps are independent — install and run from each package directory.

### API (`apps/api`)

```bash
cd apps/api
npm install
# Configure DATABASE_URL and other secrets (e.g. .env)
npx prisma generate
npm run dev   # or: npm start
```

### Web (`apps/web`)

```bash
cd apps/web
npm install
npm run dev    # Vite dev server
# npm run build && npm run preview
```

### Mobile (`apps/mobile`)

```bash
cd apps/mobile
npm install
npm start      # Expo
# npm run android | npm run ios | npm run web
```

## Notes

- The original standalone repos remain available until you confirm they can be archived or removed.
- Point web/mobile API base URLs at your local or deployed `apps/api` as needed.
