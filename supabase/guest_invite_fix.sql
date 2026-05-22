-- Guest link + invite acceptance fixes.
-- Run this without dropping existing tables.

create or replace function public.accept_my_board_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_email text;
  invite_record record;
begin
  current_user_id := auth.uid();
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if current_user_id is null or current_email = '' then
    return;
  end if;

  -- Handle both pending and already-accepted invites. This repairs older accepted
  -- invite rows that did not create a board_members row.
  for invite_record in
    select bi.id, bi.board_id, bi.email, bi.role, bi.invited_by
    from public.board_invites bi
    where bi.status in ('pending', 'accepted')
      and lower(bi.email) = current_email
  loop
    insert into public.board_members (
      board_id,
      user_id,
      email,
      display_name,
      role,
      invited_by
    )
    values (
      invite_record.board_id,
      current_user_id,
      current_email,
      current_email,
      invite_record.role,
      invite_record.invited_by
    )
    on conflict (board_id, user_id)
    do update set
      email = excluded.email,
      role = excluded.role,
      updated_at = now();

    update public.board_invites
    set status = 'accepted', accepted_by = current_user_id, accepted_at = coalesce(accepted_at, now())
    where id = invite_record.id;
  end loop;
end;
$$;

grant execute on function public.accept_my_board_invites() to authenticated;

create or replace function public.get_guest_board_access(
  p_board_id uuid,
  p_guest_token text
)
returns table (
  id uuid,
  title text,
  org_id text,
  author_id uuid,
  author_name text,
  image_url text,
  allow_guest_view boolean,
  allow_guest_edit boolean,
  guest_token text,
  guest_token_revoked_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language sql
security definer
set search_path = public
as $$
  select
    b.id,
    b.title,
    b.org_id,
    b.author_id,
    b.author_name,
    b.image_url,
    b.allow_guest_view,
    b.allow_guest_edit,
    b.guest_token,
    b.guest_token_revoked_at,
    b.created_at,
    b.updated_at
  from public.boards b
  where b.id = p_board_id
    and b.guest_token = p_guest_token
    and b.allow_guest_view = true
    and b.guest_token_revoked_at is null
  limit 1;
$$;

grant execute on function public.get_guest_board_access(uuid, text) to anon;
grant execute on function public.get_guest_board_access(uuid, text) to authenticated;

create or replace function public.rotate_board_guest_token(p_board_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_token text;
begin
  if not public.can_manage_board_members(p_board_id) then
    raise exception 'Not allowed to manage guest link';
  end if;

  next_token := encode(gen_random_bytes(24), 'hex');

  update public.boards
  set
    guest_token = next_token,
    guest_token_revoked_at = null,
    allow_guest_view = true,
    updated_at = now()
  where id = p_board_id;

  return next_token;
end;
$$;

grant execute on function public.rotate_board_guest_token(uuid) to authenticated;
