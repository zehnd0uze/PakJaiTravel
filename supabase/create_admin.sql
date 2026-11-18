-- Run this script in the Supabase SQL Editor to create a new Admin user directly
-- This bypasses the public signup page and automatically sets the correct permissions.
--
-- SECURITY: Replace BOTH placeholders below before running, and NEVER commit
-- real credentials back to git. Use a long random password (20+ chars).

DO $$
DECLARE
  new_user_id uuid;
  admin_email text := 'CHANGE_ME@example.com';
  admin_password text := 'CHANGE_ME_TO_A_LONG_RANDOM_PASSWORD';
BEGIN
  IF admin_email LIKE 'CHANGE_ME%' OR admin_password LIKE 'CHANGE_ME%' OR length(admin_password) < 16 THEN
    RAISE EXCEPTION 'Set a real admin email and a password of at least 16 characters first.';
  END IF;
  -- 1. Insert into auth.users (This safely creates the login credentials)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Admin", "role": "admin"}'::jsonb
  )
  RETURNING id INTO new_user_id;

  -- 2. Insert into auth.identities (Required for Supabase Auth to work properly)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    created_at,
    updated_at
  )
  VALUES (
    uuid_generate_v4(),
    new_user_id,
    new_user_id::text,
    jsonb_build_object('sub', new_user_id::text, 'email', admin_email),
    'email',
    now(),
    now()
  );

  -- 3. Ensure the profile role is explicitly set to admin
  -- (The trigger creates the profile automatically, we just update it here to be safe)
  UPDATE public.profiles SET role = 'admin' WHERE id = new_user_id;

END $$;
