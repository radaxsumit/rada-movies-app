# 🎬 RADA Movies

Discover movies and shows, see where to stream them legally, and share honest one-word verdicts
(**Skip · One-time watch · Must watch · Masterpiece**) with friends.

> The brand name is a placeholder. Rename it in [`src/config/site.ts`](src/config/site.ts) and swap the mark in
> [`src/components/brand/logo.tsx`](src/components/brand/logo.tsx) + [`src/app/icon.svg`](src/app/icon.svg).

## Tech stack

| Layer           | Choice                                                                    | Notes                                                                    |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Framework       | **Next.js 16** (App Router, Turbopack, Cache Components) + **TypeScript** | Server rendering for SEO and share previews; `'use cache'` for TMDB data |
| Styling         | **Tailwind CSS v4** + **shadcn/ui** (Radix, `radix-nova`)                 | Dark-only theme tokens in [`globals.css`](src/app/globals.css)           |
| Icons / fonts   | lucide-react · DM Sans (body) · Bebas Neue (display)                      | via `next/font`                                                          |
| Motion          | **Motion** (Framer Motion) · **Embla Carousel** · **Lenis** smooth scroll | Embla rows land in Phase 2                                               |
| Client data     | **TanStack Query**                                                        | For search-as-you-type, infinite lists, optimistic likes                 |
| Movie data      | **TMDB API** (server-only)                                                | Token never reaches the browser; host `api.tmdb.org`                     |
| Database + auth | **Supabase** (Postgres, Auth, Storage, RLS)                               | Schema in [`supabase/migrations`](supabase/migrations)                   |
| Validation      | **zod**                                                                   | Env + form input                                                         |
| Hosting         | **Vercel**                                                                | Preview deploy per PR                                                    |
| Quality         | ESLint (next config) · Prettier + Tailwind plugin · `tsc`                 |                                                                          |

## Project layout

```
src/
  app/                  routes (App Router), globals.css, icon.svg
  components/
    brand/              logo
    layout/             header, footer
    titles/             title card + row
    ui/                 shadcn/ui primitives (generated — edit sparingly)
    providers.tsx       TanStack Query, Lenis, tooltips, toasts
  config/               site + brand config, review verdicts
  lib/
    env.ts              validated server env
    tmdb/               server-only TMDB client, types, image URL helpers
    supabase/           browser + server clients
supabase/migrations/    SQL schema with row-level security
```

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Script                    | What it does                 |
| ------------------------- | ---------------------------- |
| `npm run dev`             | Dev server                   |
| `npm run build` / `start` | Production build / serve     |
| `npm run lint`            | ESLint                       |
| `npm run typecheck`       | Generate route types + `tsc` |
| `npm run format`          | Prettier                     |

### Environment

See [`.env.example`](.env.example). `TMDB_READ_TOKEN` is the **API Read Access Token** from
<https://www.themoviedb.org/settings/api>. Only `NEXT_PUBLIC_*` values are sent to the browser.

### Database

Create a Supabase project, then apply the schema:

- **Dashboard:** SQL Editor → paste `supabase/migrations/20261125000000_init.sql` → Run, or
- **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`.

### Sign-in setup (Supabase dashboard)

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (your real domain in production)
   - Redirect URLs: add `http://localhost:3000/**` (and `https://<your-domain>/**` later)
2. **Email**: works out of the box, but Supabase's built-in mailer only sends a few emails per hour.
   Before launch, add your own SMTP (e.g. Resend) under **Authentication → Emails → SMTP Settings**.
3. **Google (optional)**: create an OAuth client in Google Cloud Console (type _Web application_,
   redirect URI `https://varfphmktrxixbotczvj.supabase.co/auth/v1/callback`), then paste the client ID and
   secret into **Authentication → Providers → Google**. The "Continue with Google" button appears automatically.

### Watch free (legal streaming)

`/free` and `/watch/[id]` stream full films we are allowed to show, from the curated
`free_titles` table. Users can only read it; titles are added by you in the Supabase SQL editor.

**Only add a film if it is one of:**

- **Public domain in India _and_ the US.** Indian film copyright lasts 60 years from release, so in practice
  films released **before 1965**. Use the Internet Archive item (`source = 'archive'`, `source_id` = the
  identifier in `archive.org/details/<identifier>`) and check it has an `.mp4` file.
- **Released free by the rights holder** (e.g. CC0 / CC BY, like _Sita Sings the Blues_).
- **An official full-length upload on the rights holder's own YouTube channel** (`source = 'youtube'`,
  `source_id` = the video id).

```sql
insert into public.free_titles (tmdb_id, media_type, source, source_id, license, license_url, featured)
values (653, 'movie', 'archive', 'Nosferatu_DVD_quality', 'Public domain',
        'https://creativecommons.org/publicdomain/mark/1.0/', false);
```

New titles appear within an hour (the catalogue is cached), with posters and details from TMDB.

## Roadmap

- **Phase 0 – Foundation** ✅ Next.js + TS, design tokens, shadcn/ui, TMDB service, Supabase clients + schema
- **Phase 1 – Core** ✅ Movie, show, season and person pages (trailer, where to watch, cast, verdict summary, more like this), 404 + error pages
- **Phase 2 – Discovery** ✅ Rotating trailer hero, Embla carousel rows (trending, Indian, Netflix/Prime/JioHotstar, upcoming, top rated), mood chips, Ctrl+K search + /search, /movies and /tv browse with filters and infinite scroll, mobile menu
- **Phase 3 – Community** ✅ Email magic-link sign-in (+ Google when enabled), onboarding, profiles at /u/[username], four-verdict reviews with spoiler blur, likes, comments with replies, watchlist
- **Watch free** ✅ 25 public-domain / CC0 films streaming from Internet Archive, /free page, /watch player, Watch free buttons on title pages
- **Phase 4 – Fun** Lists, diary, follows feed, mood tags, watch rooms
- **Phase 5 – Ship** SEO/OG images, analytics, Sentry, moderation, custom domain

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by JustWatch.
