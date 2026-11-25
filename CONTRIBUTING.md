# Contributing to RADA Movies

Thanks for wanting to help! Bug fixes, features, design tweaks and docs improvements are all welcome.

## Ways to contribute

- **Report a bug** — open an [issue](https://github.com/radaxsumit/rada-movies-app/issues) with steps to
  reproduce, what you expected, and a screenshot if it's visual.
- **Suggest a feature** — open an issue first so we can agree on the idea before you build it.
- **Send a pull request** — for anything bigger than a small fix, comment on (or open) an issue first.

## Getting set up

You need your **own** free keys — the project's production keys are never shared.

1. **Fork** this repo, then clone your fork:
   ```bash
   git clone https://github.com/<your-username>/rada-movies-app.git
   cd rada-movies-app
   npm install
   ```
2. Create a free [TMDB](https://www.themoviedb.org/signup) account and a free [Supabase](https://supabase.com)
   project.
3. Copy `.env.example` to `.env.local` and fill in the values
   (see [README → Environment variables](README.md#1-environment-variables)).
4. Run the SQL files in `supabase/migrations` **in filename order** in your Supabase project.
5. In Supabase → Authentication → URL Configuration, add `http://localhost:3000/**` as a Redirect URL.
6. `npm run dev` and open http://localhost:3000.

Never commit `.env.local` or any key — it's already in `.gitignore`.

## Making changes

1. Create a branch from `main`:
   ```bash
   git switch -c fix/search-empty-state     # or feat/..., docs/...
   ```
2. Make your change. Keep pull requests focused: one fix or feature per PR.
3. Before pushing, make sure all of these pass:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   npm run format
   ```
4. Commit with a clear message in the imperative mood, e.g. `Fix search palette closing on Enter`.
5. Push to your fork and open a pull request against `main`. Describe **what** changed and **why**, and add
   screenshots for UI changes (desktop and mobile).

## Guidelines

**Code**

- TypeScript everywhere; avoid `any`.
- Keep secrets on the server: anything that uses `TMDB_READ_TOKEN` lives in `src/lib/tmdb` (marked
  `server-only`). Only `NEXT_PUBLIC_*` values may reach the browser.
- Server actions must re-check the signed-in user (`getViewer()`) and validate input with `zod` — never trust the
  client.
- Reuse the existing UI components in `src/components/ui` and the theme colours in `src/app/globals.css`.
- Make it work on mobile and with keyboard only; give images alt text and buttons labels.

**Database**

- Never edit an existing migration. Add a new file in `supabase/migrations` named
  `YYYYMMDDHHMMSS_short_description.sql`.
- Every new table needs row-level security enabled and policies, plus explicit `grant`s.
- Mention schema changes clearly in your PR description so they can be applied before deploying.

**Content and legal**

- Movie data must come from TMDB (keep the attribution in the footer).
- Don't add links to, or embeds from, sites that stream films without the rights to do so.

## Reporting a security issue

Please **don't** open a public issue for security problems. Use GitHub's private
[**Report a vulnerability**](https://github.com/radaxsumit/rada-movies-app/security/advisories/new) form instead.

## Be kind

Be respectful and constructive in issues, reviews and discussions. Harassment of any kind isn't tolerated.

By contributing, you agree that your contributions are licensed under the project's [MIT License](LICENSE).
