create extension if not exists "pgcrypto";

drop table if exists public.board_exports cascade;
drop table if exists public.board_members cascade;
drop table if exists public.board_invites cascade;
drop table if exists public.user_favorites cascade;
drop table if exists public.boards cascade;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  org_id text not null default 'personal',
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'User',
  image_url text not null default '/placeholders/1.svg',
  allow_guest_view boolean not null default false,
  allow_guest_edit boolean not null default false,
  guest_token text not null default encode(gen_random_bytes(24), 'hex'),
  guest_token_revoked_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger set_boards_updated_at before update on public.boards for each row execute function public.set_updated_at();

create table public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'viewer',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(board_id, user_id),
  constraint board_members_role_check check (role in ('owner', 'co_owner', 'editor', 'viewer'))
);
create trigger set_board_members_updated_at before update on public.board_members for each row execute function public.set_updated_at();

create table public.board_invites (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  accepted_at timestamp with time zone,
  unique(board_id, email),
  constraint board_invites_role_check check (role in ('co_owner', 'editor', 'viewer')),
  constraint board_invites_status_check check (status in ('pending', 'accepted', 'revoked'))
);

create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  org_id text not null default 'personal',
  created_at timestamp with time zone not null default now(),
  unique(user_id, board_id)
);

create table public.board_exports (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  exported_by uuid references auth.users(id) on delete set null,
  export_type text not null,
  file_url text,
  created_at timestamp with time zone not null default now(),
  constraint board_exports_type_check check (export_type in ('png', 'pdf'))
);

create or replace function public.is_board_owner(p_board_id uuid) returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from public.boards b where b.id = p_board_id and b.author_id = auth.uid()); $$;
create or replace function public.board_role(p_board_id uuid) returns text language sql security definer set search_path = public as $$ select case when exists (select 1 from public.boards b where b.id = p_board_id and b.author_id = auth.uid()) then 'owner' else (select bm.role from public.board_members bm where bm.board_id = p_board_id and bm.user_id = auth.uid() limit 1) end; $$;
create or replace function public.can_view_board(p_board_id uuid) returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from public.boards b where b.id = p_board_id and b.author_id = auth.uid()) or exists (select 1 from public.board_members bm where bm.board_id = p_board_id and bm.user_id = auth.uid()) or exists (select 1 from public.board_invites bi where bi.board_id = p_board_id and bi.status in ('pending', 'accepted') and lower(bi.email) = lower(coalesce(auth.jwt() ->> 'email', ''))); $$;
create or replace function public.can_edit_board(p_board_id uuid) returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from public.boards b where b.id = p_board_id and b.author_id = auth.uid()) or exists (select 1 from public.board_members bm where bm.board_id = p_board_id and bm.user_id = auth.uid() and bm.role in ('owner', 'co_owner', 'editor')) or exists (select 1 from public.board_invites bi where bi.board_id = p_board_id and bi.status in ('pending', 'accepted') and bi.role in ('co_owner', 'editor') and lower(bi.email) = lower(coalesce(auth.jwt() ->> 'email', ''))); $$;
create or replace function public.can_manage_board_members(p_board_id uuid) returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from public.boards b where b.id = p_board_id and b.author_id = auth.uid()) or exists (select 1 from public.board_members bm where bm.board_id = p_board_id and bm.user_id = auth.uid() and bm.role in ('owner', 'co_owner')); $$;

create index boards_author_created_idx on public.boards(author_id, created_at desc);
create index boards_author_updated_idx on public.boards(author_id, updated_at desc);
create index boards_guest_token_idx on public.boards(guest_token);
create index board_members_board_idx on public.board_members(board_id);
create index board_members_user_idx on public.board_members(user_id);
create index board_members_user_board_idx on public.board_members(user_id, board_id);
create index board_invites_board_idx on public.board_invites(board_id);
create index board_invites_email_idx on public.board_invites(email);
create index favorites_user_org_idx on public.user_favorites(user_id, org_id);
create index exports_board_idx on public.board_exports(board_id);

alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.board_invites enable row level security;
alter table public.user_favorites enable row level security;
alter table public.board_exports enable row level security;

create policy "boards_select_accessible" on public.boards for select to authenticated using (author_id = auth.uid() or public.can_view_board(id));
create policy "boards_insert_own" on public.boards for insert to authenticated with check (author_id = auth.uid());
create policy "boards_update_editable" on public.boards for update to authenticated using (public.can_edit_board(id)) with check (public.can_edit_board(id));
create policy "boards_delete_owner" on public.boards for delete to authenticated using (author_id = auth.uid());
create policy "board_members_select_accessible" on public.board_members for select to authenticated using (public.can_view_board(board_id));
create policy "board_members_insert_manage_or_accept_invite" on public.board_members for insert to authenticated with check (public.can_manage_board_members(board_id) or (user_id = auth.uid() and exists (select 1 from public.board_invites bi where bi.board_id = board_members.board_id and bi.status in ('pending', 'accepted') and lower(bi.email) = lower(coalesce(auth.jwt() ->> 'email', '')) and bi.role = board_members.role)));
create policy "board_members_update_manage" on public.board_members for update to authenticated using (public.can_manage_board_members(board_id)) with check (public.can_manage_board_members(board_id));
create policy "board_members_delete_manage" on public.board_members for delete to authenticated using (public.can_manage_board_members(board_id));
create policy "board_invites_select_accessible" on public.board_invites for select to authenticated using (public.can_view_board(board_id) or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy "board_invites_insert_manage" on public.board_invites for insert to authenticated with check (public.can_manage_board_members(board_id));
create policy "board_invites_update_manage_or_accept" on public.board_invites for update to authenticated using (public.can_manage_board_members(board_id) or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) with check (public.can_manage_board_members(board_id) or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy "board_invites_delete_manage" on public.board_invites for delete to authenticated using (public.can_manage_board_members(board_id));
create policy "favorites_select_own" on public.user_favorites for select to authenticated using (user_id = auth.uid());
create policy "favorites_insert_own" on public.user_favorites for insert to authenticated with check (user_id = auth.uid() and public.can_view_board(board_id));
create policy "favorites_delete_own" on public.user_favorites for delete to authenticated using (user_id = auth.uid());
create policy "exports_select_accessible" on public.board_exports for select to authenticated using (public.can_view_board(board_id));
create policy "exports_insert_editable" on public.board_exports for insert to authenticated with check (public.can_edit_board(board_id));
create policy "exports_delete_owner" on public.board_exports for delete to authenticated using (public.is_board_owner(board_id));

drop policy if exists "board_images_authenticated_upload" on storage.objects;
drop policy if exists "board_images_public_read" on storage.objects;
drop policy if exists "board_images_authenticated_update" on storage.objects;
drop policy if exists "board_images_authenticated_delete" on storage.objects;
create policy "board_images_authenticated_upload" on storage.objects for insert to authenticated with check (bucket_id = 'board-images');
create policy "board_images_public_read" on storage.objects for select to public using (bucket_id = 'board-images');
create policy "board_images_authenticated_update" on storage.objects for update to authenticated using (bucket_id = 'board-images') with check (bucket_id = 'board-images');
create policy "board_images_authenticated_delete" on storage.objects for delete to authenticated using (bucket_id = 'board-images');
