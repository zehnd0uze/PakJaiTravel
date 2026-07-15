-- Supabase Schema for PakJaiTravel

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Linked to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null,
  role text default 'user',
  is_verified boolean default false,
  avatar text,
  cover_photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROPERTIES TABLE
create table properties (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  rating numeric,
  reviews integer default 0,
  price_per_night numeric not null,
  currency text default 'THB',
  image_url text,
  images text[] default array[]::text[],
  is_verified boolean default false,
  features text[] default array[]::text[],
  amenities text[] default array[]::text[],
  location text,
  province text,
  district text,
  description text,
  check_in text default '14:00',
  check_out text default '11:00',
  host_info jsonb default '{}'::jsonb,
  contact jsonb default '{}'::jsonb,
  owner_id uuid references profiles(id) on delete cascade not null,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POSTS TABLE
create table posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  author_name text,
  author_avatar text,
  content text not null,
  image_url text,
  location_tag text,
  lat numeric,
  lng numeric,
  rating numeric,
  price_rating text,
  property_id uuid references properties(id) on delete set null,
  likes uuid[] default array[]::uuid[], -- Array of user IDs who liked the post
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POST COMMENTS TABLE
create table comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  author_name text,
  author_avatar text,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table properties enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- PROPERTIES POLICIES
create policy "Properties are viewable by everyone." on properties for select using (true);
create policy "Hosts can insert properties." on properties for insert with check (auth.uid() = owner_id);
create policy "Hosts can update their own properties." on properties for update using (auth.uid() = owner_id);
create policy "Hosts can delete their own properties." on properties for delete using (auth.uid() = owner_id);

-- POSTS POLICIES
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Users can insert posts." on posts for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts." on posts for update using (auth.uid() = user_id);
create policy "Users can delete their own posts." on posts for delete using (auth.uid() = user_id);

-- COMMENTS POLICIES
create policy "Comments are viewable by everyone." on comments for select using (true);
create policy "Users can insert comments." on comments for insert with check (auth.uid() = user_id);
create policy "Users can update their own comments." on comments for update using (auth.uid() = user_id);
create policy "Users can delete their own comments." on comments for delete using (auth.uid() = user_id);

-- Create trigger for handling new user signups via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'name', 
    new.email, 
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
