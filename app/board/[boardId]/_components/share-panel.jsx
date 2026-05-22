"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, RefreshCcw, Send, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getBoard,
  getBoardInvites,
  getBoardMembers,
  inviteBoardMember,
  removeBoardMember,
  updateBoardMemberRole,
  updateGuestAccess,
  revokeGuestLink,
  rotateGuestLink,
} from "@/lib/boards";
import { makeGuestLink } from "@/lib/utils";

export const SharePanel = ({ boardId }) => {
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);

  const guestLink = useMemo(() => {
    if (!board?.allowGuestView || !board?.guestToken) return "";

    return makeGuestLink(boardId, board.guestToken);
  }, [board?.allowGuestView, board?.guestToken, boardId]);

  const load = async () => {
    if (!open) return;

    try {
      const [nextBoard, nextMembers, nextInvites] = await Promise.all([
        getBoard(boardId),
        getBoardMembers(boardId),
        getBoardInvites(boardId),
      ]);

      setBoard(nextBoard);
      setMembers(nextMembers);
      setInvites(nextInvites);
    } catch (error) {
      toast.error(error.message || "Could not load sharing settings");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, boardId]);

  const onInvite = async () => {
    setLoading(true);

    try {
      await inviteBoardMember({ boardId, email, role });
      setEmail("");
      await load();
      toast.success("Invite saved");
    } catch (error) {
      toast.error(error.message || "Invite failed");
    } finally {
      setLoading(false);
    }
  };

  const onGuestToggle = async (changes) => {
    if (!board) return;

    setLoading(true);

    const nextAllowView = changes.allowGuestView ?? board.allowGuestView;
    const nextAllowEdit = changes.allowGuestEdit ?? board.allowGuestEdit;

    try {
      await updateGuestAccess({
        boardId,
        allowGuestView: nextAllowView,
        allowGuestEdit: nextAllowView ? nextAllowEdit : false,
      });

      await load();
      toast.success("Guest settings updated");
    } catch (error) {
      toast.error(error.message || "Could not update guest settings");
    } finally {
      setLoading(false);
    }
  };

  const onCopyGuestLink = async () => {
    if (!guestLink) {
      toast.error("Enable guest view first");
      return;
    }

    await navigator.clipboard.writeText(guestLink);
    toast.success("Guest link copied");
  };

  const onRefreshGuestLink = async () => {
    setLoading(true);

    try {
      const nextBoard = await rotateGuestLink({ boardId });
      setBoard(nextBoard);

      const nextLink = makeGuestLink(boardId, nextBoard.guestToken);
      await navigator.clipboard.writeText(nextLink);

      toast.success("New guest link created and copied");
    } catch (error) {
      toast.error(error.message || "Could not refresh guest link");
    } finally {
      setLoading(false);
    }
  };

  const onDisableGuestLink = async () => {
    setLoading(true);

    try {
      await revokeGuestLink({ boardId });
      await load();
      toast.success("Guest link disabled");
    } catch (error) {
      toast.error(error.message || "Could not disable guest link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="board" className="px-2 gap-x-2">
          <Users className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share board</DialogTitle>
          <DialogDescription>
            Invite users, manage roles, and create a guest link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border p-3 space-y-3">
            <div className="font-medium text-sm">Invite by email</div>

            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border rounded-md px-3 text-sm bg-white"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="co_owner">Co-owner</option>
              </select>

              <Button onClick={onInvite} disabled={loading || !email}>
                <Send className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="font-medium text-sm">Guest link</div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(board?.allowGuestView)}
                  disabled={loading}
                  onChange={(e) =>
                    onGuestToggle({ allowGuestView: e.target.checked })
                  }
                />
                Allow view
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(board?.allowGuestEdit)}
                  disabled={loading || !board?.allowGuestView}
                  onChange={(e) =>
                    onGuestToggle({
                      allowGuestEdit: e.target.checked,
                      allowGuestView: e.target.checked ? true : undefined,
                    })
                  }
                />
                Allow edit
              </label>
            </div>

            <div className="flex gap-2">
              <Input
                value={guestLink}
                readOnly
                placeholder="Enable guest view to use guest link"
              />

              <Button
                variant="outline"
                onClick={onCopyGuestLink}
                disabled={loading || !guestLink}
                title="Copy guest link"
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                title="Create new guest link and copy it"
                onClick={onRefreshGuestLink}
                disabled={loading}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                title="Disable guest link"
                onClick={onDisableGuestLink}
                disabled={loading || !board?.allowGuestView}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Refresh creates a new guest link and copies it. Old guest links stop
              working.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="font-medium text-sm mb-2">Members</div>

              <div className="space-y-2 max-h-48 overflow-auto">
                {members.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No members yet.
                  </div>
                )}

                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2 text-sm border rounded-md p-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {member.display_name || member.email || "Member"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <select
                        value={member.role}
                        onChange={async (e) => {
                          await updateBoardMemberRole({
                            memberId: member.id,
                            role: e.target.value,
                          });
                          await load();
                        }}
                        className="border rounded px-1 py-1 text-xs bg-white"
                      >
                        <option value="viewer">viewer</option>
                        <option value="editor">editor</option>
                        <option value="co_owner">co_owner</option>
                      </select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await removeBoardMember({ memberId: member.id });
                          await load();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="font-medium text-sm mb-2">Invites</div>

              <div className="space-y-2 max-h-48 overflow-auto">
                {invites.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No invites.
                  </div>
                )}

                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-2 text-sm border rounded-md p-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{invite.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {invite.status}
                      </div>
                    </div>

                    <div className="text-xs bg-neutral-100 px-2 py-1 rounded-md">
                      {invite.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3" />
            Sharing uses Supabase roles and Liveblocks room authorization.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
