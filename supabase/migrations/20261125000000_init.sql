-- Initial schema: profiles, reviews (four verdicts), likes, comments, follows,
-- watchlist, lists, diary, reports. Titles are referenced by TMDB id + media type;
-- TMDB stays the source of truth for movie data.
--
-- Applied to project rada-movies (ap-south-1) on 2026-11-25 via the Supabase connector.

create extension if not exists citext with schema extensions;

create type public.media_type as enum ('movie', 'tv');
create type public.verdict as enum ('skip', 'one_time', 'must_watch', 'masterpiece');

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    extensions.citext unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 50),
  avatar_url  text,
  bio         text check (char_length(bio) <= 300),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── reviews ─────────────────────────
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  tmdb_id       integer not null,
  media_type    public.media_type not null,
  verdict       public.verdict not null,
  body          text check (char_length(body) <= 5000),
  has_spoilers  boolean not null default false,
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);
create index reviews_title_idx on public.reviews (tmdb_id, media_type, created_at desc);
create index reviews_user_idx on public.reviews (user_id, created_at desc);

create table public.review_likes (
  review_id  uuid not null references public.reviews (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table public.review_comments (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.review_comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index review_comments_review_idx on public.review_comments (review_id, created_at);
create index review_comments_user_idx on public.review_comments (user_id);
create index review_comments_parent_idx on public.review_comments (parent_id);
create index review_likes_user_idx on public.review_likes (user_id);

-- Per-title verdict breakdown, kept up to date by trigger so title pages read one row.
create table public.title_stats (
  tmdb_id          integer not null,
  media_type       public.media_type not null,
  review_count     integer not null default 0,
  skip_count       integer not null default 0,
  one_time_count   integer not null default 0,
  must_watch_count integer not null default 0,
  masterpiece_count integer not null default 0,
  primary key (tmdb_id, media_type)
);

-- ───────────────────────── social + collections ─────────────────────────
create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.watchlist (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  tmdb_id    integer not null,
  media_type public.media_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

create table public.diary_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  tmdb_id    integer not null,
  media_type public.media_type not null,
  watched_on date not null default current_date,
  rewatch    boolean not null default false,
  created_at timestamptz not null default now()
);
create index diary_user_idx on public.diary_entries (user_id, watched_on desc);

create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 1000),
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index lists_user_idx on public.lists (user_id);

create table public.list_items (
  list_id    uuid not null references public.lists (id) on delete cascade,
  tmdb_id    integer not null,
  media_type public.media_type not null,
  position   integer not null default 0,
  note       text check (char_length(note) <= 500),
  primary key (list_id, tmdb_id, media_type)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  review_id   uuid references public.reviews (id) on delete cascade,
  comment_id  uuid references public.review_comments (id) on delete cascade,
  reason      text not null check (char_length(reason) <= 500),
  created_at  timestamptz not null default now(),
  check (num_nonnulls(review_id, comment_id) = 1)
);
create index reports_reporter_idx on public.reports (reporter_id);
create index reports_review_idx on public.reports (review_id);
create index reports_comment_idx on public.reports (comment_id);

-- ───────────────────────── triggers ─────────────────────────
-- Guard reviews: clients can't set counters or move a review to another title/user.
-- Counter updates from the triggers below run at trigger depth > 1 and pass through.
create or replace function public.guard_review() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.like_count = 0;
    new.comment_count = 0;
  elsif pg_trigger_depth() = 1 then
    new.like_count = old.like_count;
    new.comment_count = old.comment_count;
    new.user_id = old.user_id;
    new.tmdb_id = old.tmdb_id;
    new.media_type = old.media_type;
    new.updated_at = now();
  end if;
  return new;
end $$;
create trigger reviews_guard before insert or update on public.reviews
  for each row execute function public.guard_review();

-- Keep title_stats in sync with reviews.
create or replace function public.bump_title_stats(p_tmdb integer, p_type public.media_type, p_verdict public.verdict, p_delta integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.title_stats (tmdb_id, media_type) values (p_tmdb, p_type) on conflict do nothing;
  update public.title_stats set
    review_count      = review_count + p_delta,
    skip_count        = skip_count        + case when p_verdict = 'skip'        then p_delta else 0 end,
    one_time_count    = one_time_count    + case when p_verdict = 'one_time'    then p_delta else 0 end,
    must_watch_count  = must_watch_count  + case when p_verdict = 'must_watch'  then p_delta else 0 end,
    masterpiece_count = masterpiece_count + case when p_verdict = 'masterpiece' then p_delta else 0 end
  where tmdb_id = p_tmdb and media_type = p_type;
end $$;

create or replace function public.on_review_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.bump_title_stats(old.tmdb_id, old.media_type, old.verdict, -1);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.bump_title_stats(new.tmdb_id, new.media_type, new.verdict, 1);
  end if;
  return null;
end $$;
create trigger reviews_stats after insert or update of verdict or delete on public.reviews
  for each row execute function public.on_review_change();

-- Denormalised like/comment counters.
create or replace function public.on_like_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.reviews set like_count = like_count + case when tg_op = 'INSERT' then 1 else -1 end
  where id = coalesce(new.review_id, old.review_id);
  return null;
end $$;
create trigger review_likes_count after insert or delete on public.review_likes
  for each row execute function public.on_like_change();

create or replace function public.on_comment_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.reviews set comment_count = comment_count + case when tg_op = 'INSERT' then 1 else -1 end
  where id = coalesce(new.review_id, old.review_id);
  return null;
end $$;
create trigger review_comments_count after insert or delete on public.review_comments
  for each row execute function public.on_comment_change();

-- These run only from triggers. Block direct calls through the API (e.g. /rest/v1/rpc/bump_title_stats).
revoke execute on function public.bump_title_stats(integer, public.media_type, public.verdict, integer) from public, anon, authenticated;
revoke execute on function public.on_review_change() from public, anon, authenticated;
revoke execute on function public.on_like_change() from public, anon, authenticated;
revoke execute on function public.on_comment_change() from public, anon, authenticated;
revoke execute on function public.guard_review() from public, anon, authenticated;

-- ───────────────────────── row level security ─────────────────────────
alter table public.profiles        enable row level security;
alter table public.reviews         enable row level security;
alter table public.review_likes    enable row level security;
alter table public.review_comments enable row level security;
alter table public.title_stats     enable row level security;
alter table public.follows         enable row level security;
alter table public.watchlist       enable row level security;
alter table public.diary_entries   enable row level security;
alter table public.lists           enable row level security;
alter table public.list_items      enable row level security;
alter table public.reports         enable row level security;

-- Public read for community content.
create policy "profiles readable"   on public.profiles        for select using (true);
create policy "reviews readable"    on public.reviews         for select using (true);
create policy "likes readable"      on public.review_likes    for select using (true);
create policy "comments readable"   on public.review_comments for select using (true);
create policy "stats readable"      on public.title_stats     for select using (true);
create policy "follows readable"    on public.follows         for select using (true);
create policy "diary readable"      on public.diary_entries   for select using (true);
create policy "lists readable"      on public.lists           for select using (is_public or user_id = (select auth.uid()));
create policy "list items readable" on public.list_items      for select using (
  exists (select 1 from public.lists l where l.id = list_id and (l.is_public or l.user_id = (select auth.uid())))
);
create policy "watchlist private"   on public.watchlist       for select using (user_id = (select auth.uid()));

-- Owners write their own rows. Counters/stats are only changed by the triggers above.
create policy "own profile insert" on public.profiles for insert with check (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own reviews insert" on public.reviews for insert with check (user_id = (select auth.uid()));
create policy "own reviews update" on public.reviews for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own reviews delete" on public.reviews for delete using (user_id = (select auth.uid()));

create policy "own likes insert" on public.review_likes for insert with check (user_id = (select auth.uid()));
create policy "own likes delete" on public.review_likes for delete using (user_id = (select auth.uid()));

create policy "own comments insert" on public.review_comments for insert with check (user_id = (select auth.uid()));
create policy "own comments delete" on public.review_comments for delete using (user_id = (select auth.uid()));

create policy "own follows insert" on public.follows for insert with check (follower_id = (select auth.uid()));
create policy "own follows delete" on public.follows for delete using (follower_id = (select auth.uid()));

create policy "own watchlist insert" on public.watchlist for insert with check (user_id = (select auth.uid()));
create policy "own watchlist update" on public.watchlist for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own watchlist delete" on public.watchlist for delete using (user_id = (select auth.uid()));
create policy "own diary insert" on public.diary_entries for insert with check (user_id = (select auth.uid()));
create policy "own diary update" on public.diary_entries for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own diary delete" on public.diary_entries for delete using (user_id = (select auth.uid()));
create policy "own lists insert" on public.lists for insert with check (user_id = (select auth.uid()));
create policy "own lists update" on public.lists for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own lists delete" on public.lists for delete using (user_id = (select auth.uid()));
create policy "own list items insert" on public.list_items for insert with check (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));
create policy "own list items update" on public.list_items for update using (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))) with check (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));
create policy "own list items delete" on public.list_items for delete using (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));

create policy "own reports insert" on public.reports for insert with check (reporter_id = (select auth.uid()));

-- ───────────────────────── table privileges ─────────────────────────
-- This project does not auto-expose new tables to the Data API, so grant explicitly.
grant usage on schema public to anon, authenticated;

-- Public community content: readable by everyone (RLS policies still filter rows).
grant select on public.profiles, public.reviews, public.review_likes, public.review_comments,
  public.title_stats, public.follows, public.diary_entries, public.lists, public.list_items
  to anon, authenticated;

-- Private / write access: signed-in users only, rows limited by RLS.
grant select on public.watchlist to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant insert, delete on public.review_likes, public.review_comments, public.follows to authenticated;
grant insert, update, delete on public.watchlist, public.diary_entries, public.lists, public.list_items to authenticated;
grant insert on public.reports to authenticated;
