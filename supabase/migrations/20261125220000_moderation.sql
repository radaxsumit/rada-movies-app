-- Phase 5: moderation, rate limits and self-service account deletion.

-- ───────────────────────── admins ─────────────────────────
-- Add an admin from the SQL editor:
--   insert into public.admins (user_id) select id from public.profiles where username = 'your_username';
create table public.admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins see own row" on public.admins for select using (user_id = (select auth.uid()));
grant select on public.admins to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ───────────────────────── reports ─────────────────────────
-- One report per person per item.
create unique index reports_once_review on public.reports (reporter_id, review_id) where review_id is not null;
create unique index reports_once_comment on public.reports (reporter_id, comment_id) where comment_id is not null;

create policy "admins read reports" on public.reports for select using ((select public.is_admin()));
create policy "admins resolve reports" on public.reports for delete using ((select public.is_admin()));
grant select, delete on public.reports to authenticated;

-- Admins may remove any review or comment (owners already can remove their own).
create policy "admins delete reviews" on public.reviews for delete using ((select public.is_admin()));
create policy "admins delete comments" on public.review_comments for delete using ((select public.is_admin()));

-- ───────────────────────── rate limits ─────────────────────────
-- Simple per-user write limits, enforced in the database so they can't be bypassed from the client.
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
    else return new;
  end case;

  if recent >= max_per_hour then
    raise exception 'rate_limited' using errcode = 'P0429', hint = 'Too many in the last hour. Try again later.';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;

create trigger reviews_rate_limit before insert on public.reviews for each row execute function public.enforce_rate_limit();
create trigger comments_rate_limit before insert on public.review_comments for each row execute function public.enforce_rate_limit();
create trigger reports_rate_limit before insert on public.reports for each row execute function public.enforce_rate_limit();
create trigger lists_rate_limit before insert on public.lists for each row execute function public.enforce_rate_limit();
create trigger diary_rate_limit before insert on public.diary_entries for each row execute function public.enforce_rate_limit();

-- ───────────────────────── account deletion ─────────────────────────
-- Deletes the caller's auth user; everything they own cascades away (profile, reviews, likes,
-- comments, lists, diary, watchlist, follows, reports). Verdict stats update via triggers.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in';
  end if;
  delete from auth.users where id = (select auth.uid());
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
