# Sprechen — Learn German

A spaced-repetition German learning app (A1–B1) with listening, typing, word-bank, multiple-choice, and speaking exercises.

## Live app

**https://app-dusky-nine-52.vercel.app**

Scan to open on your phone:

![QR code to open the live app](docs/qr-code.png)

## Project structure

- `app/` — Next.js application (deployed to Vercel)
- `supabase/` — database migrations and seed data
- `scripts/` — one-off maintenance SQL/JS scripts
- `source/` — local textbook source material (not committed)

## Development

```bash
cd app
npm install
npm run dev
```

Requires a `.env.local` in `app/` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Pushes to `master` automatically redeploy the live app via Vercel's GitHub integration.
