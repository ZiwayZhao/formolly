
-- Create a function to safely get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = user_id;
EXCEPTION
  WHEN SQLSTATE '42P01' THEN
    -- Table doesn't exist, return empty result
    RETURN;
END;
$$;
