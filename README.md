# LifeOS

Personal life management web app built with Next.js 14, Tailwind CSS,
shadcn/ui and Supabase.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/dashboard`.

## Environment

Fill these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Without Supabase env values, the dashboard shell still renders, but auth and
data writes are disabled.

## Database

Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor or with
the Supabase CLI. The migration creates the LifeOS tables, indexes, RLS
policies and the auth trigger that creates `public.users` and
`public.user_profiles` rows for each new Supabase Auth user.

## Current foundation

- Auth pages: `/login`, `/register`
- Email/password and Google OAuth actions through Supabase Auth
- Protected dashboard namespace: `/dashboard`
- Dashboard shell: sidebar, topbar, user menu, responsive drawer
- Settings page: profile and health goal form
- Placeholder routes for Timeline, Workout, Activities, Nutrition, Weight,
  Goals, Skills, Finance, Journal and AI

## Google OAuth

To use Google sign-in, enable Google in Supabase:

1. Open `Authentication > Sign In / Providers > Google`.
2. Add the Google OAuth Client ID and Client Secret.
3. In Google Cloud, add the Supabase callback URL as an authorized redirect URI:
   `https://zrjonafvuzllmnhvyjjb.supabase.co/auth/v1/callback`.
4. In Supabase `Authentication > URL Configuration`, add local app redirects:
   `http://localhost:3000/auth/callback` and `http://localhost:3001/auth/callback`.
