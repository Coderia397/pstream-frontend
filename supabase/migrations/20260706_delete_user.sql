-- Account deletion RPC for users to self-delete their account and trigger CASCADE deletions
-- Must be SECURITY DEFINER to bypass RLS and delete from auth.users.

create or replace function delete_user()
returns void
language sql
security definer
as $$
  -- We assume that public.profiles has an ON DELETE CASCADE foreign key to auth.users.
  -- Deleting from auth.users will automatically clean up all associated data.
  delete from auth.users where id = auth.uid();
$$;
