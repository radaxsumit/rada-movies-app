-- Phase 3: create a profile automatically when someone signs up, and track onboarding.

alter table public.profiles add column needs_onboarding boolean not null default true;

-- Signed-in users may update their own profile, including finishing onboarding.
-- (Table-level grant already exists; RLS limits it to their own row.)

-- Build a unique, valid username (^[a-z0-9_]{3,20}$) from the email or OAuth name.
create or replace function public.generate_username(seed text)
returns text language plpgsql set search_path = '' as $$
declare
  base text := left(regexp_replace(lower(coalesce(seed, '')), '[^a-z0-9_]', '', 'g'), 14);
  candidate text;
begin
  if char_length(base) < 3 then base := 'viewer'; end if;
  loop
    candidate := base || '_' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles p where p.username = candidate::extensions.citext);
  end loop;
  return candidate;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  name text := nullif(trim(coalesce(meta->>'full_name', meta->>'name', '')), '');
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    public.generate_username(coalesce(meta->>'user_name', split_part(new.email, '@', 1))),
    left(coalesce(name, split_part(new.email, '@', 1)), 50),
    meta->>'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.generate_username(text) from public, anon, authenticated;

-- Backfill profiles for anyone who signed up before this trigger existed.
insert into public.profiles (id, username, display_name)
select u.id, public.generate_username(split_part(u.email, '@', 1)), left(split_part(u.email, '@', 1), 50)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
