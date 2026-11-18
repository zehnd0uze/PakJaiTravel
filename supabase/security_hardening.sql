-- ════════════════════════════════════════════════════════════════════
-- PakJai — Security Hardening Migration
-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Fixes:
--   1. CRITICAL  Sign-up privilege escalation (role taken from user metadata)
--   2. CRITICAL  Users could promote themselves to admin / verified via profile update
--   3. HIGH      All user emails were publicly readable (profiles SELECT = true)
--   4. HIGH      Hosts could self-verify properties or reassign owner_id
--   5. MEDIUM    Post owners could forge likes; others' likes silently failed
--   6. MEDIUM    Author name/avatar on posts & comments could be spoofed
--   7. MEDIUM    Claimants could submit pre-approved claims
--   8. LOW       SECURITY DEFINER functions without a pinned search_path
-- ════════════════════════════════════════════════════════════════════

-- ── 0. Helper: is the current caller an admin? ──────────────────────
-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ── 1. Sign-up trigger: never trust client-supplied role ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar, role, is_verified)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1), 'User'), 80),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'user',                                   -- always 'user'; admins are promoted manually
    new.email_confirmed_at is not null
  )
  on conflict (id) do update set
    email = excluded.email,
    name  = coalesce(profiles.name, excluded.name);
  return new;
end;
$$;

-- Keep is_verified in sync when a user confirms their email
create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles set is_verified = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute procedure public.handle_user_email_confirmed();


-- ── 2. Protect privileged profile columns ───────────────────────────
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / SQL editor (no JWT) and admins may change anything
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Email can only be changed through account settings';
  end if;

  -- Self-serve "Become a host" is allowed; anything else is admin-only
  if new.role is distinct from old.role then
    if not (old.role = 'user' and new.role = 'host') then
      raise exception 'You are not allowed to change this role';
    end if;
  end if;

  -- Verified badge only if the email is actually confirmed
  if new.is_verified is distinct from old.is_verified then
    if new.is_verified is not true or not exists (
      select 1 from auth.users where id = old.id and email_confirmed_at is not null
    ) then
      new.is_verified := old.is_verified;
    end if;
  end if;

  new.name := left(trim(new.name), 80);
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute procedure public.protect_profile_columns();


-- ── 3. Profiles: private by default (emails no longer public) ───────
-- Public author info is already denormalised onto posts/comments.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can view own profile, admins view all" on public.profiles;
create policy "Users can view own profile, admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile."
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());


-- ── 4. Properties: hosts cannot self-verify or hijack ownership ─────
create or replace function public.protect_property_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    if tg_op = 'UPDATE' then new.updated_at := now(); end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.owner_id    := auth.uid();
  else
    new.is_verified := old.is_verified;
    if new.owner_id is distinct from old.owner_id then
      raise exception 'Property ownership can only be transferred by an admin';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists protect_property_columns on public.properties;
create trigger protect_property_columns
  before insert or update on public.properties
  for each row execute procedure public.protect_property_columns();

drop policy if exists "Hosts can update their own properties." on public.properties;
create policy "Hosts can update their own properties."
  on public.properties for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Admins can insert properties" on public.properties;
create policy "Admins can insert properties"
  on public.properties for insert
  with check (public.is_admin());


-- ── 5. Posts: likes only via toggle_like(); authorship is server-set ─
create or replace function public.protect_post_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select name, avatar into p from public.profiles where id = auth.uid();
    new.user_id       := auth.uid();
    new.author_name   := coalesce(p.name, new.author_name);
    new.author_avatar := coalesce(p.avatar, new.author_avatar);
    new.likes         := array[]::uuid[];
    return new;
  end if;

  -- UPDATE
  if new.user_id is distinct from old.user_id then
    raise exception 'Post owner cannot be changed';
  end if;
  if new.likes is distinct from old.likes
     and coalesce(current_setting('pakjai.toggle_like', true), '') <> 'on' then
    raise exception 'Use toggle_like() to like a post';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_post_columns on public.posts;
create trigger protect_post_columns
  before insert or update on public.posts
  for each row execute procedure public.protect_post_columns();

-- Any signed-in user can like/unlike any post — only their own id
create or replace function public.toggle_like(target_post_id uuid)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result uuid[];
begin
  if uid is null then
    raise exception 'Login required';
  end if;

  perform set_config('pakjai.toggle_like', 'on', true);

  update public.posts
     set likes = case
                   when uid = any(coalesce(likes, '{}')) then array_remove(likes, uid)
                   else array_append(coalesce(likes, '{}'), uid)
                 end
   where id = target_post_id
  returning likes into result;

  perform set_config('pakjai.toggle_like', 'off', true);

  if result is null then
    raise exception 'Post not found';
  end if;
  return result;
end;
$$;

revoke all on function public.toggle_like(uuid) from public, anon;
grant execute on function public.toggle_like(uuid) to authenticated;

drop policy if exists "Users can update their own posts." on public.posts;
create policy "Users can update their own posts."
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can delete any post" on public.posts;
create policy "Admins can delete any post"
  on public.posts for delete
  using (public.is_admin());


-- ── 6. Comments: authorship is server-set ───────────────────────────
create or replace function public.protect_comment_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select name, avatar into p from public.profiles where id = auth.uid();
    new.user_id       := auth.uid();
    new.author_name   := coalesce(p.name, new.author_name);
    new.author_avatar := coalesce(p.avatar, new.author_avatar);
  else
    if new.user_id is distinct from old.user_id or new.post_id is distinct from old.post_id then
      raise exception 'Comment owner/post cannot be changed';
    end if;
    new.author_name   := old.author_name;
    new.author_avatar := old.author_avatar;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_comment_columns on public.comments;
create trigger protect_comment_columns
  before insert or update on public.comments
  for each row execute procedure public.protect_comment_columns();

drop policy if exists "Admins can delete any comment" on public.comments;
create policy "Admins can delete any comment"
  on public.comments for delete
  using (public.is_admin());


-- ── 7. Length limits (stop multi-MB spam payloads) ──────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_content_length') then
    alter table public.posts add constraint posts_content_length check (char_length(content) <= 5000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_text_length') then
    alter table public.comments add constraint comments_text_length check (char_length(text) between 1 and 2000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_name_length') then
    alter table public.profiles add constraint profiles_name_length check (char_length(name) <= 80) not valid;
  end if;
end $$;


-- ── 8. Property claims: always start as pending ─────────────────────
create or replace function public.protect_claim_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.user_id     := auth.uid();
  new.status      := 'pending';
  new.admin_notes := null;
  return new;
end;
$$;

drop trigger if exists protect_claim_columns on public.property_claims;
create trigger protect_claim_columns
  before insert on public.property_claims
  for each row execute procedure public.protect_claim_columns();


-- ── 9. Admin-only user deletion: pin search_path ────────────────────
create or replace function public.delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can delete users.';
  end if;
  if auth.uid() = target_user_id then
    raise exception 'You cannot delete your own admin account.';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_user(uuid) from public, anon;
grant execute on function public.delete_user(uuid) to authenticated;


-- ── 10. Audit: list any admins you did not expect ───────────────────
-- select id, email, role, created_at from public.profiles where role = 'admin';
