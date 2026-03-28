# BlogCraft Frontend

Frontend for BlogCraft built with React, TypeScript, and Vite.

## Requirements

- Node.js 18+
- pnpm (recommended)

## Environment

Create `fe/.env` with:

```env
VITE_API_BASE_URL=https://blog-craft.onrender.com/api
```

If not set, the app falls back to `http://localhost:8000/api`.

## Run Locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Notes

- API calls are configured in `src/Generator.tsx`.
- Use Vercel environment variables to set `VITE_API_BASE_URL` in production.
