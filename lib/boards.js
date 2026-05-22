import { supabase } from "@/lib/supabase/client";

const images = [
  "/placeholders/1.svg",
  "/placeholders/2.svg",
  "/placeholders/3.svg",
  "/placeholders/4.svg",
  "/placeholders/5.svg",
  "/placeholders/6.svg",
  "/placeholders/7.svg",
  "/placeholders/8.svg",
  "/placeholders/9.svg",
  "/placeholders/10.svg",
];

export function getGuestTokenFromBrowser() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);

  return (
    params.get("guest") ||
    params.get("token") ||
    params.get("guestToken") ||
    null
  );
}

function randomGuestToken() {
  const bytes = new Uint8Array(24);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toBoardCard(board, favoriteRows = []) {
  const isFavorite = favoriteRows.some(
    (favorite) => favorite.board_id === board.id
  );

  return {
    _id: board.id,
    id: board.id,
    title: board.title,
    orgId: board.org_id,
    authorId: board.author_id,
    authorName: board.author_name || "User",
    imageUrl: board.image_url || "/placeholders/1.svg",
    allowGuestView: board.allow_guest_view,
    allowGuestEdit: board.allow_guest_edit,
    guestToken: board.guest_token,
    guestTokenRevokedAt: board.guest_token_revoked_at,
    _creationTime: new Date(board.created_at).getTime(),
    createdAt: board.created_at,
    updatedAt: board.updated_at,
    isFavorite,
  };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return data.user;
}

export async function acceptMyPendingInvites() {
  const { error } = await supabase.rpc("accept_my_board_invites");

  if (error) {
    console.error("Could not accept pending invites:", error.message);
  }
}

export async function getGuestBoard(boardId, guestToken = getGuestTokenFromBrowser()) {
  if (!guestToken) {
    throw new Error("Guest token is missing");
  }

  const { data, error } = await supabase.rpc("get_guest_board_access", {
    p_board_id: boardId,
    p_guest_token: guestToken,
  });

  const board = Array.isArray(data) ? data[0] : null;

  if (error || !board) {
    throw new Error("Guest access is disabled");
  }

  return toBoardCard(board);
}

export async function getBoardAccess(boardId) {
  const guestToken = getGuestTokenFromBrowser();

  if (guestToken) {
    try {
      const board = await getGuestBoard(boardId, guestToken);

      return {
        canView: Boolean(board.allowGuestView),
        canEdit: Boolean(board.allowGuestEdit),
        role: board.allowGuestEdit ? "guest_editor" : "guest_viewer",
        isGuest: true,
        board,
      };
    } catch (_error) {
      return {
        canView: false,
        canEdit: false,
        role: "guest_disabled",
        isGuest: true,
        board: null,
      };
    }
  }

  await acceptMyPendingInvites();

  const { data: role } = await supabase.rpc("board_role", {
    p_board_id: boardId,
  });

  const { data: canView } = await supabase.rpc("can_view_board", {
    p_board_id: boardId,
  });

  const { data: canEdit } = await supabase.rpc("can_edit_board", {
    p_board_id: boardId,
  });

  return {
    canView: Boolean(canView || role === "owner"),
    canEdit: Boolean(canEdit || role === "owner"),
    role: role || null,
    isGuest: false,
    board: null,
  };
}

export async function getBoards({ orgId = "personal", search, favorites } = {}) {
  const user = await getCurrentUser();

  await acceptMyPendingInvites();

  const { data: favoriteRows, error: favError } = await supabase
    .from("user_favorites")
    .select("board_id")
    .eq("user_id", user.id)
    .eq("org_id", orgId);

  if (favError) {
    throw favError;
  }

  let query = supabase
    .from("boards")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (favorites) {
    const ids = favoriteRows.map((row) => row.board_id);

    if (!ids.length) {
      return [];
    }

    query = query.in("id", ids);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((board) => toBoardCard(board, favoriteRows));
}

export async function getBoard(id) {
  const guestToken = getGuestTokenFromBrowser();

  if (guestToken) {
    return await getGuestBoard(id, guestToken);
  }

  await acceptMyPendingInvites();

  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return toBoardCard(data);
}

export async function getBoardRole(boardId) {
  await acceptMyPendingInvites();

  const { data, error } = await supabase.rpc("board_role", {
    p_board_id: boardId,
  });

  return error ? null : data;
}

export async function getBoardMembers(boardId) {
  const { data, error } = await supabase
    .from("board_members")
    .select("id, user_id, email, display_name, role, created_at")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getBoardInvites(boardId) {
  const { data, error } = await supabase
    .from("board_invites")
    .select("id, email, role, status, created_at")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function inviteBoardMember({ boardId, email, role = "viewer" }) {
  const user = await getCurrentUser();

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Enter a valid email address");
  }

  const { error } = await supabase.from("board_invites").upsert(
    {
      board_id: boardId,
      email: cleanEmail,
      role,
      status: "pending",
      invited_by: user.id,
    },
    {
      onConflict: "board_id,email",
    }
  );

  if (error) {
    throw error;
  }

  return true;
}

export async function removeBoardMember({ memberId }) {
  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    throw error;
  }

  return true;
}

export async function updateBoardMemberRole({ memberId, role }) {
  const { error } = await supabase
    .from("board_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    throw error;
  }

  return true;
}

export async function updateGuestAccess({
  boardId,
  allowGuestView,
  allowGuestEdit,
}) {
  const updatePayload = {
    allow_guest_view: allowGuestView,
    allow_guest_edit: allowGuestEdit,
  };

  if (allowGuestView) {
    updatePayload.guest_token_revoked_at = null;
  }

  if (!allowGuestView) {
    updatePayload.allow_guest_edit = false;
  }

  const { error } = await supabase
    .from("boards")
    .update(updatePayload)
    .eq("id", boardId);

  if (error) {
    throw error;
  }

  return true;
}

export async function rotateGuestLink({ boardId }) {
  const { data: newToken, error } = await supabase.rpc("rotate_board_guest_token", {
    p_board_id: boardId,
  });

  if (error) {
    // Fallback for local projects that have not run guest_invite_fix.sql yet.
    const fallbackToken = randomGuestToken();

    const { error: updateError } = await supabase
      .from("boards")
      .update({
        guest_token: fallbackToken,
        guest_token_revoked_at: null,
        allow_guest_view: true,
      })
      .eq("id", boardId);

    if (updateError) {
      throw updateError;
    }

    return await getBoard(boardId);
  }

  const board = await getBoard(boardId);

  return {
    ...board,
    guestToken: newToken || board.guestToken,
    allowGuestView: true,
  };
}

export async function revokeGuestLink({ boardId }) {
  const { error } = await supabase
    .from("boards")
    .update({
      allow_guest_view: false,
      allow_guest_edit: false,
      guest_token_revoked_at: new Date().toISOString(),
    })
    .eq("id", boardId);

  if (error) {
    throw error;
  }

  return true;
}

export async function createBoard({
  orgId = "personal",
  title = "Untitled",
} = {}) {
  const user = await getCurrentUser();

  const randomImage = images[Math.floor(Math.random() * images.length)];

  const authorName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "User";

  const { data, error } = await supabase
    .from("boards")
    .insert({
      title,
      org_id: orgId,
      author_id: user.id,
      author_name: authorName,
      image_url: randomImage,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateBoard({ id, title }) {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error("Title is required");
  }

  if (cleanTitle.length > 60) {
    throw new Error("Title cannot be longer than 60 characters");
  }

  const { error } = await supabase
    .from("boards")
    .update({ title: cleanTitle })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

export async function removeBoard({ id }) {
  const { error } = await supabase.from("boards").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

export async function favoriteBoard({ id, orgId = "personal" }) {
  const user = await getCurrentUser();

  const { error } = await supabase.from("user_favorites").upsert(
    {
      user_id: user.id,
      board_id: id,
      org_id: orgId,
    },
    {
      onConflict: "user_id,board_id",
    }
  );

  if (error) {
    throw error;
  }

  return true;
}

export async function unfavoriteBoard({ id }) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("board_id", id);

  if (error) {
    throw error;
  }

  return true;
}

export const boardApi = {
  create: createBoard,
  remove: removeBoard,
  update: updateBoard,
  favorite: favoriteBoard,
  unfavorite: unfavoriteBoard,
};
