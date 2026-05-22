import { Liveblocks } from "@liveblocks/node";
import { createClient } from "@supabase/supabase-js";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

function getServerClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    }
  );
}

export async function POST(request) {
  try {
    const { room, guestToken } = await request.json();

    const token = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!room) {
      return new Response("Missing room id", { status: 403 });
    }

    const supabase = getServerClient(token);

    // Guest links must work both when logged out and when logged in.
    // If a guest token is present, it is allowed independently of board membership.
    if (guestToken) {
      const { data, error } = await supabase.rpc("get_guest_board_access", {
        p_board_id: room,
        p_guest_token: guestToken,
      });

      const guestBoard = Array.isArray(data) ? data[0] : null;

      if (error || !guestBoard || !guestBoard.allow_guest_view) {
        return new Response("Guest access is disabled", { status: 403 });
      }

      const session = liveblocks.prepareSession(
        `guest-${guestToken.slice(0, 12)}`,
        {
          userInfo: {
            name: "Guest",
            picture: "",
          },
        }
      );

      session.allow(
        room,
        guestBoard.allow_guest_edit
          ? session.FULL_ACCESS
          : session.READ_ACCESS
      );

      const { status, body } = await session.authorize();

      return new Response(body, {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!token) {
      return new Response("Unauthorized", { status: 403 });
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response("Unauthorized", { status: 403 });
    }

    await supabase.rpc("accept_my_board_invites");

    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("id, author_id")
      .eq("id", room)
      .single();

    if (boardError || !board) {
      return new Response("Board not found or no access", { status: 403 });
    }

    const { data: canEdit } = await supabase.rpc("can_edit_board", {
      p_board_id: room,
    });

    const { data: canView } = await supabase.rpc("can_view_board", {
      p_board_id: room,
    });

    const isOwner = board.author_id === userData.user.id;

    if (!canView && !isOwner) {
      return new Response("No board access", { status: 403 });
    }

    const user = userData.user;

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Teammate";

    const picture = user.user_metadata?.avatar_url || "";

    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name,
        picture,
      },
    });

    session.allow(
      room,
      canEdit || isOwner ? session.FULL_ACCESS : session.READ_ACCESS
    );

    const { status, body } = await session.authorize();

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(error?.message || "Liveblocks auth failed", {
      status: 500,
    });
  }
}
