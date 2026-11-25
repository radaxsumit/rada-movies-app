-- "Watch free": a curated catalogue of films we are allowed to stream.
--
-- Rules for adding a title (see README → Watch free):
--   * source = 'archive': Internet Archive item that is public domain in BOTH India and the US.
--     India: film copyright lasts 60 years from release, so only films released before 1965,
--     or films the rights holder released under a free licence (e.g. CC0 / CC BY).
--   * source = 'youtube': an official full-length upload by the rights holder's own channel.
-- Public can only read. There are deliberately no insert/update/delete policies: titles are
-- added from the Supabase dashboard (or service role), never by users.

create table public.free_titles (
  id          uuid primary key default gen_random_uuid(),
  tmdb_id     integer not null,
  media_type  public.media_type not null default 'movie',
  source      text not null check (source in ('archive', 'youtube')),
  source_id   text not null check (source_id ~ '^[A-Za-z0-9._-]{3,120}$'),
  license     text not null,
  license_url text,
  featured    boolean not null default false,
  sort_order  integer not null default 100,
  added_at    timestamptz not null default now(),
  unique (source, source_id)
);
create index free_titles_title_idx on public.free_titles (media_type, tmdb_id);
create index free_titles_order_idx on public.free_titles (featured desc, sort_order);

alter table public.free_titles enable row level security;
create policy "free titles readable" on public.free_titles for select using (true);
grant select on public.free_titles to anon, authenticated;

-- Seed: 25 films verified on 2026-11-25 (Internet Archive item has a playable MP4; TMDB id matched
-- by title + release year; all released before 1965 except Sita Sings the Blues, which is CC0).
insert into public.free_titles (tmdb_id, media_type, source, source_id, license, license_url, featured, sort_order) values
  (20529, 'movie', 'archive', 'Sita_Sings_the_Blues', 'CC0, dedicated to the public domain by the filmmaker', 'https://creativecommons.org/publicdomain/zero/1.0/', true, 0),
  (3085, 'movie', 'archive', 'his_girl_friday', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', true, 10),
  (653, 'movie', 'archive', 'Nosferatu_DVD_quality', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', true, 20),
  (961, 'movie', 'archive', 'The_General_Buster_Keaton', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', true, 30),
  (20367, 'movie', 'archive', 'Detour', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 40),
  (43795, 'movie', 'archive', 'penny_serenade', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 50),
  (41462, 'movie', 'archive', 'Hitch_Hiker', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 60),
  (21296, 'movie', 'archive', 'kansascityconfidencial', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 70),
  (22733, 'movie', 'archive', 'BeatTheDevil1953', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 80),
  (25768, 'movie', 'archive', 'steamboat_bill_ipod', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 90),
  (15856, 'movie', 'archive', 'house_on_haunted_hill_ipod', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 100),
  (964, 'movie', 'archive', 'ThePhantomoftheOpera', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 110),
  (42518, 'movie', 'archive', 'gullivers_travels1939', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 120),
  (234, 'movie', 'archive', 'DasKabinettdesDoktorCaligariTheCabinetofDrCaligari', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 130),
  (17058, 'movie', 'archive', 'ScarletStreet', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 140),
  (18646, 'movie', 'archive', 'royal_wedding', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 150),
  (32574, 'movie', 'archive', 'meet_john_doe', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 160),
  (26531, 'movie', 'archive', 'little_princess', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 170),
  (16093, 'movie', 'archive', 'CarnivalofSouls', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', true, 180),
  (643, 'movie', 'archive', 'BattleshipPotemkin', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 190),
  (20246, 'movie', 'archive', 'TheStranger_0', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 200),
  (15263, 'movie', 'archive', 'mclintok_widescreen', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 210),
  (24452, 'movie', 'archive', 'The_Little_Shop_of_Horrors.mpeg', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 220),
  (18995, 'movie', 'archive', 'doa_ipod', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 230),
  (43905, 'movie', 'archive', 'humanbondage', 'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', false, 240)
on conflict (source, source_id) do nothing;
