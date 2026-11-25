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

## Roadmap

- **Phase 0 – Foundation** ✅ Next.js + TS, design tokens, shadcn/ui, TMDB service, Supabase clients + schema
- **Phase 1 – Core** ✅ Movie, show, season and person pages (trailer, where to watch, cast, verdict summary, more like this), 404 + error pages
- **Phase 2 – Discovery** ✅ Rotating trailer hero, Embla carousel rows (trending, Indian, Netflix/Prime/JioHotstar, upcoming, top rated), mood chips, Ctrl+K search + /search, /movies and /tv browse with filters and infinite scroll, mobile menu
- **Phase 3 – Community** Auth, profiles, verdict reviews, likes, comments, spoiler blur, watchlist
- **Phase 4 – Fun** Lists, diary, follows feed, mood tags, watch rooms
- **Phase 5 – Ship** SEO/OG images, analytics, Sentry, moderation, custom domain

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by JustWatch.
