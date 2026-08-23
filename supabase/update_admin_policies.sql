-- Allow Admins to update properties
CREATE POLICY "Admins can update properties." ON properties 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow Admins to delete properties (optional, but good for completeness)
CREATE POLICY "Admins can delete properties." ON properties 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
