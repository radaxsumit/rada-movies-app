<div align="center">

# 🎬 RADA Movies

**Find what to watch. Say what you thought.**

Discover movies and shows, see where they're streaming in India, watch trailers, and share honest one-word verdicts with friends.

[**Live site →**](https://rada-movies.vercel.app) &nbsp;·&nbsp; [Report a bug](https://github.com/radaxsumit/rada-movies-app/issues) &nbsp;·&nbsp; [Contribute](CONTRIBUTING.md)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3ECF8E?logo=supabase&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

<img src="https://rada-movies.vercel.app/opengraph-image" alt="RADA Movies" width="720" />

</div>

---

## What is it?

RADA Movies is a movie and TV discovery site with a community review system. Instead of star ratings, every
review starts with one clear verdict:

| Verdict               | Means                   |
| --------------------- | ----------------------- |
| 🔴 **Skip**           | Not worth your time     |
| 🟡 **One-time watch** | Fine for a lazy evening |
| 🟢 **Must watch**     | Go for it               |
| 🟣 **Masterpiece**    | All-time great          |

It doesn't host or stream films. "Where to watch" shows which services (Netflix, Prime Video, JioHotstar…)
have a title in India and links to them.

## Features

**Discover**

- Rotating trailer hero, smooth carousel rows (trending, Indian, by streaming service, upcoming, top rated)
- Browse movies and shows by genre, mood, language, year, streaming service or "Made in India"
- Instant search with <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>/</kbd>) across movies, shows and people
- Title pages with trailer, cast, where to watch, seasons and episodes; person pages with full filmography

**Community**

- Email magic-link sign-in (Google optional), profiles at `/u/username`
- Four-verdict reviews with spoiler blur, likes, comments and replies
- Watchlist, custom public/private lists, a watch diary, follows and a friends' activity feed
- Reporting and an admin moderation queue

**Under the hood**

- Server-rendered and cached pages (fast, SEO-friendly, shareable link previews, sitemap)
- API keys stay on the server; database access is protected by Postgres row-level security
- Rate limits, security headers, account deletion, privacy and terms pages

## Tech stack

| Area      | Tools                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Cache Components), React 19, TypeScript                   |
| UI        | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) (Radix), lucide icons, Motion, Embla Carousel, Lenis |
| Data      | [TMDB API](https://developer.themoviedb.org) (movies, shows, people, where-to-watch), TanStack Query    |
| Backend   | [Supabase](https://supabase.com) — Postgres, Auth, row-level security                                   |
| Hosting   | [Vercel](https://vercel.com) (+ Vercel Analytics)                                                       |
| Quality   | ESLint, Prettier, `tsc`                                                                                 |

## Run it locally

You'll need **Node.js 20.9+**, a free **[TMDB](https://www.themoviedb.org/signup)** account and a free
**[Supabase](https://supabase.com)** project. Setup takes about 10 minutes.

```bash
git clone https://github.com/radaxsumit/rada-movies-app.git
cd rada-movies-app
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

### 1. Environment variables

| Variable                               | Where to get it                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `TMDB_READ_TOKEN`                      | TMDB → Settings → API → **API Read Access Token** (server-only, never sent to the browser) |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → Project URL                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable key (`sb_publishable_…`)              |
| `NEXT_PUBLIC_SITE_URL`                 | `http://localhost:3000` locally; your real URL in production                               |

### 2. Database

Run the SQL files in [`supabase/migrations`](supabase/migrations) **in filename order**, either:

- **Supabase dashboard:** SQL Editor → paste each file → Run, or
- **Supabase CLI:** `npx supabase link --project-ref <your-project-ref>` then `npx supabase db push`

### 3. Sign-in

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/**`

Email sign-in works straight away for testing (Supabase's built-in mailer is rate-limited; use your own SMTP,
e.g. Resend, in production). For Google sign-in, create an OAuth client in Google Cloud Console with the redirect
URI `https://<your-project-ref>.supabase.co/auth/v1/callback` and add it under **Authentication → Providers →
Google** — the button appears automatically.

### 4. Make yourself an admin (optional)

Admins can review reports at `/admin/reports`. Sign in once, then run in the SQL Editor:

```sql
insert into public.admins (user_id) select id from public.profiles where username = 'your_username';
```

## Scripts

| Command                       | What it does                       |
| ----------------------------- | ---------------------------------- |
| `npm run dev`                 | Start the dev server               |
| `npm run build` / `npm start` | Production build / serve it        |
| `npm run lint`                | ESLint                             |
| `npm run typecheck`           | Generate route types and run `tsc` |
| `npm run format`              | Format with Prettier               |

## Project structure

```
src/
  app/                 Pages and routes (App Router), API routes, server actions
    actions/           Server actions: reviews, lists, diary, follows, moderation, auth
    api/               Public JSON endpoints (search, discover) with rate limits
  components/          UI, grouped by feature (titles, reviews, social, browse, home, auth…)
    ui/                shadcn/ui primitives
  config/              Site name, nav, verdicts, moods, streaming services
  lib/
    tmdb/              Server-only TMDB client and data shaping
    supabase/          Supabase clients (browser, server, public) and DB types
    auth.ts            Who's signed in, admin check, safe redirects
    reviews.ts         Cached community reads
  proxy.ts             Refreshes the sign-in session on each request
supabase/migrations/   Database schema, security rules and triggers
```

## Deploy your own

1. Import the repo on [Vercel](https://vercel.com/new) (framework: Next.js, no overrides needed).
2. Add the four environment variables above, with `NEXT_PUBLIC_SITE_URL` set to your Vercel URL.
3. In Supabase, add your Vercel URL as the Site URL and `https://your-url/**` as a Redirect URL.
4. Optional: set the function region close to your database (Settings → Functions) and add a Vercel Firewall
   rate-limit rule for `/api/*`.

## Contributing

Contributions are welcome — bug fixes, features, design polish, docs. Read **[CONTRIBUTING.md](CONTRIBUTING.md)**
for setup, coding guidelines and how to open a pull request. Ideas to pick up:

- Profile picture uploads (Supabase Storage)
- Hindi and other Indian-language UI
- Notifications for likes, comments and new followers
- Tests (unit tests for `lib/`, end-to-end tests for sign-in and reviews)
- More "where to watch" regions

## Credits

- Movie and show data from [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not
  endorsed or certified by TMDB.
- Streaming availability by [JustWatch](https://www.justwatch.com) (via TMDB).

## License

[MIT](LICENSE) © Sumit Prajapati
