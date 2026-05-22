"use client";

import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export const InviteButton = () => {
  return (
    <Button
      onClick={() => toast.info("Supabase workspace invites can be added later. Board links can be copied from each board menu.")}
      className="rounded-[20px] border border-[#244ea9] bg-[linear-gradient(135deg,#2e79d3,#6653df)] px-4 text-white shadow-[0_12px_26px_rgba(51,92,196,0.26)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(51,92,196,0.30)]"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      Invite friends
    </Button>
  );
};
