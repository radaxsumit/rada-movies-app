-- Security hardening from the pre-launch audit. Signed-in users can call the REST API directly
-- (not just through the app's forms), so these rules live in the database.

-- 1. Avatars: only images from known hosts (Google sign-in, Supabase Storage). Stops someone setting
--    a tracking-pixel URL that would log the IP address of everyone who views their profile.
update public.profiles
set avatar_url = null
where avatar_url is not null
  and avatar_url !~ '^https://(lh[0-9]+\.googleusercontent\.com|[a-z0-9-]+\.supabase\.co)/';

alter table public.profiles
  add constraint profiles_avatar_url_host check (
    avatar_url is null
    or avatar_url ~ '^https://(lh[0-9]+\.googleusercontent\.com|[a-z0-9-]+\.supabase\.co)/'
  );

-- 2. Integrity checks that need a trigger (they depend on the current date or other rows).
create or replace function public.check_integrity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'diary_entries' then
    if new.watched_on > current_date + 1 or new.watched_on < date '1888-01-01' then
      raise exception 'invalid_watch_date';
    end if;
  elsif tg_table_name = 'review_comments' and new.parent_id is not null then
    -- A reply must belong to the same review, and only one level deep.
    if not exists (
      select 1 from public.review_comments c
      where c.id = new.parent_id and c.review_id = new.review_id and c.parent_id is null
    ) then
      raise exception 'invalid_parent_comment';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.check_integrity() from public, anon, authenticated;

create trigger diary_integrity before insert or update on public.diary_entries
  for each row execute function public.check_integrity();
create trigger comments_integrity before insert or update on public.review_comments
  for each row execute function public.check_integrity();

-- 3. Rate limits for likes and follows too (spam toggling).
create or replace function public.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  recent int;
  max_per_hour int;
begin
  case tg_table_name
    when 'reviews' then uid := new.user_id; max_per_hour := 30;
      select count(*) into recent from public.reviews where user_id = uid and created_at > now() - interval '1 hour';
    when 'review_comments' then uid := new.user_id; max_per_hour := 60;
      select count(*) into recent from public.review_comments where user_id = uid and created_at > now() - interval '1 hour';
    when 'reports' then uid := new.reporter_id; max_per_hour := 15;
      select count(*) into recent from public.reports where reporter_id = uid and created_at > now() - interval '1 hour';
    when 'lists' then uid := new.user_id; max_per_hour := 20;
      select count(*) into recent from public.lists where user_id = uid and created_at > now() - interval '1 hour';
    when 'diary_entries' then uid := new.user_id; max_per_hour := 60;
      select count(*) into recent from public.diary_entries where user_id = uid and created_at > now() - interval '1 hour';
    when 'review_likes' then uid := new.user_id; max_per_hour := 300;
      select count(*) into recent from public.review_likes where user_id = uid and created_at > now() - interval '1 hour';
    when 'follows' then uid := new.follower_id; max_per_hour := 100;
      select count(*) into recent from public.follows where follower_id = uid and created_at > now() - interval '1 hour';
    else return new;
  end case;

  if recent >= max_per_hour then
    raise exception 'rate_limited' using errcode = 'P0429', hint = 'Too many in the last hour. Try again later.';
  end if;
  return new;
end $$;

create trigger likes_rate_limit before insert on public.review_likes for each row execute function public.enforce_rate_limit();
create trigger follows_rate_limit before insert on public.follows for each row execute function public.enforce_rate_limit();
