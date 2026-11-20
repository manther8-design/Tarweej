# `@tarweej/web`

Public Tarweej marketplace storefront (Next.js App Router).

```bash
pnpm --filter @tarweej/web dev
# http://localhost:3002
```

## Auth / API

- Env (either name works; prefer the documented public URL):
  - `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
  - fallback: `NEXT_PUBLIC_API_BASE_URL` (same default)
- Login: `POST /identity/auth/login` with email/password
- Session: `localStorage` key `tarweej.web.session` (same pattern as admin’s `tarweej.admin.session`)
- Authenticated calls send `Authorization: Bearer <accessToken>`
- Seed user: `seller@tarweej.local` / `Seller123!`

After login the app redirects to `/dashboard/listings` (overview at `/dashboard`).
