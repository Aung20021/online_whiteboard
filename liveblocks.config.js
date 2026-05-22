"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { supabase } from "@/lib/supabase/client";

function getGuestTokenFromUrl() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);

  return (
    params.get("guest") ||
    params.get("token") ||
    params.get("guestToken") ||
    null
  );
}

const client = createClient({
  throttle: 16,

  async authEndpoint(room) {
    const guestToken = getGuestTokenFromUrl();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    if (!accessToken && !guestToken) {
      throw new Error("You must be logged in or use a valid guest link.");
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers,
      body: JSON.stringify({
        room,
        guestToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Liveblocks authentication failed.");
    }

    return await response.json();
  },

  async resolveUsers({ userIds }) {
    return userIds.map((userId) => ({
      id: userId,
      name: userId.startsWith("guest-") ? "Guest" : "User",
      avatar: undefined,
    }));
  },

  async resolveMentionSuggestions() {
    return [];
  },
});

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useObject,
    useMap,
    useList,
    useBatch,
    useHistory,
    useUndo,
    useRedo,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStatus,
    useLostConnectionListener,
    useThreads,
    useUser,
    useCreateThread,
    useEditThreadMetadata,
    useCreateComment,
    useEditComment,
    useDeleteComment,
    useAddReaction,
    useRemoveReaction,
  },
} = createRoomContext(client);
