# @zeitmail/mail-new

Nuxt migration of the mail app, created alongside the existing Next.js app at `apps/mail`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment

The app reads backend and app URLs from:

- `NUXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `VITE_PUBLIC_BACKEND_URL`
- `NUXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `VITE_PUBLIC_APP_URL`

If none are provided, it falls back to:

- backend: `http://localhost:8787`
- app: `http://localhost:3000`
