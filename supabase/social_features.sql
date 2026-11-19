-- ════════════════════════════════════════════════════════════════════
-- PakJai — Social Features Migration (Find Friends, Follow, Replies, Comment Likes)
-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent).
-- Preserves all privacy & security rules from security_hardening.sql
-- (user emails are NEVER exposed publicly).
-- ════════════════════════════════════════════════════════════════════

-- ── 1. FOLLOWS TABLE ────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists idx_follows_follower on public.follows (follower_id);
create index if not exists idx_follows_following on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "Users can unfollow others" on public.follows;
create policy "Users can unfollow others"
  on public.follows for delete
  using (auth.uid() = follower_id);


-- ── 2. THREADED COMMENT REPLIES & COMMENT LIKES ─────────────────────
alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade;

alter table public.comments
  add column if not exists likes uuid[] default array[]::uuid[];

create index if not exists idx_comments_parent_id on public.comments (parent_id);

-- Server-side toggle for comment likes (caller can only add/remove their own auth.uid())
create or replace function public.toggle_comment_like(target_comment_id uuid)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  updated_likes uuid[];
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  update public.comments
  set likes = case
    when uid = any(coalesce(likes, array[]::uuid[])) then array_remove(coalesce(likes, array[]::uuid[]), uid)
    else array_append(coalesce(likes, array[]::uuid[]), uid)
  end
  where id = target_comment_id
  returning likes into updated_likes;

  return coalesce(updated_likes, array[]::uuid[]);
end;
$$;

revoke all on function public.toggle_comment_like(uuid) from public;
grant execute on function public.toggle_comment_like(uuid) to authenticated;


-- ── 3. SAFE FIND FRIENDS RPC (NEVER EXPOSES EMAILS) ─────────────────
create or replace function public.search_friends(
  search_query text default '',
  max_results integer default 24
)
returns table (
  id uuid,
  name text,
  avatar text,
  role text,
  is_verified boolean,
  posts_count bigint,
  followers_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.avatar,
    p.role,
    p.is_verified,
    coalesce((select count(*) from public.posts po where po.user_id = p.id), 0) as posts_count,
    coalesce((select count(*) from public.follows f where f.following_id = p.id), 0) as followers_count
  from public.profiles p
  where
    (coalesce(trim(search_query), '') = '' or p.name ilike '%' || trim(search_query) || '%')
    and p.role <> 'admin'
  order by followers_count desc, posts_count desc, p.created_at desc
  limit greatest(1, least(coalesce(max_results, 24), 50));
$$;

revoke all on function public.search_friends(text, integer) from public;
grant execute on function public.search_friends(text, integer) to anon, authenticated;


-- ── 4. SAFE PUBLIC PROFILE RPC (NEVER EXPOSES EMAILS) ───────────────
create or replace function public.get_public_profile(target_user_id uuid)
returns table (
  id uuid,
  name text,
  avatar text,
  cover_photo text,
  role text,
  is_verified boolean,
  created_at timestamp with time zone,
  followers_count bigint,
  following_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.avatar,
    p.cover_photo,
    p.role,
    p.is_verified,
    p.created_at,
    coalesce((select count(*) from public.follows f where f.following_id = p.id), 0) as followers_count,
    coalesce((select count(*) from public.follows f where f.follower_id = p.id), 0) as following_count
  from public.profiles p
  where p.id = target_user_id
  limit 1;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;


-- ── 5. SAFE FOLLOW LIST RPC (FOLLOWERS / FOLLOWING, NO EMAILS) ──────
create or replace function public.get_follow_list(
  target_user_id uuid,
  list_mode text default 'followers'
)
returns table (
  id uuid,
  name text,
  avatar text,
  role text,
  is_verified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar, p.role, p.is_verified
  from public.profiles p
  where (
    list_mode = 'followers' and exists (
      select 1 from public.follows f where f.following_id = target_user_id and f.follower_id = p.id
    )
  ) or (
    list_mode = 'following' and exists (
      select 1 from public.follows f where f.follower_id = target_user_id and f.following_id = p.id
    )
  )
  order by p.name asc
  limit 100;
$$;

revoke all on function public.get_follow_list(uuid, text) from public;
grant execute on function public.get_follow_list(uuid, text) to anon, authenticated;
