-- 1. Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'), 
    NEW.email, 
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Add Admin RLS Policies for properties (Ignore error if you already ran this)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'properties' AND policyname = 'Admins can update properties.'
    ) THEN
        CREATE POLICY "Admins can update properties." ON properties 
        FOR UPDATE USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'properties' AND policyname = 'Admins can delete properties.'
    ) THEN
        CREATE POLICY "Admins can delete properties." ON properties 
        FOR DELETE USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END
$$;


-- 3. Create property_claims table for ownership requests
CREATE TABLE IF NOT EXISTS property_claims (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  proof_notes text,
  proof_url text,
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE property_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'property_claims' AND policyname = 'Claims are viewable by claimant and admins'
    ) THEN
        CREATE POLICY "Claims are viewable by claimant and admins" 
        ON property_claims FOR SELECT 
        USING (
          auth.uid() = user_id 
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'property_claims' AND policyname = 'Authenticated users can submit claims'
    ) THEN
        CREATE POLICY "Authenticated users can submit claims" 
        ON property_claims FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'property_claims' AND policyname = 'Admins can update claims'
    ) THEN
        CREATE POLICY "Admins can update claims" 
        ON property_claims FOR UPDATE 
        USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'property_claims' AND policyname = 'Admins can delete claims'
    ) THEN
        CREATE POLICY "Admins can delete claims" 
        ON property_claims FOR DELETE 
        USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END
$$;
