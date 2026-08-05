-- PROPERTY CLAIMS TABLE & POLICIES
-- Allows accommodation owners to request ownership of pre-listed/seeded homestays
-- Requires admin review and approval

create table if not exists property_claims (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references properties(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  email text,
  proof_notes text,
  proof_url text,
  status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table property_claims enable row level security;

-- Policies
create policy "Claims are viewable by claimant and admins" 
on property_claims for select 
using (
  auth.uid() = user_id 
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Authenticated users can submit claims" 
on property_claims for insert 
with check (auth.uid() = user_id);

create policy "Admins can update claims" 
on property_claims for update 
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins can delete claims" 
on property_claims for delete 
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
