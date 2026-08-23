-- Create a secure function to allow admins to completely delete a user from auth.users
-- This cascades and deletes their profile, properties, posts, and comments.

CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the database owner (postgres)
AS $$
BEGIN
  -- 1. Check if the person calling this function is actually an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
  END IF;

  -- 2. Prevent an admin from deleting themselves accidentally
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot delete your own admin account.';
  END IF;

  -- 3. Delete the user from the secure auth.users table
  -- Because of our foreign key ON DELETE CASCADE, this will automatically 
  -- delete their profile, properties, and everything else linked to them.
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$;
