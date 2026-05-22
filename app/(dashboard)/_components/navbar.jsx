"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { LogOut, Star, LayoutDashboard, UserCircle, Palette } from "lucide-react";
import { toast } from "sonner";

import { SearchInput } from "./search-input";
import { InviteButton } from "./invite-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";

export const Navbar = () => {
  const { user } = useSupabaseAuth();
  const searchParams = useSearchParams();
  const favorites = searchParams.get("favorites");

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <header className="animate-soft-enter rounded-[26px] border border-white/80 bg-white/82 p-3 shadow-[0_18px_48px_rgba(55,42,27,0.10)] ring-1 ring-[#e8ddce]/80 backdrop-blur-2xl sm:rounded-[34px] sm:p-4 lg:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(250px,0.75fr)_minmax(520px,1fr)] 2xl:grid-cols-[minmax(300px,0.9fr)_minmax(620px,1fr)_auto] xl:items-center">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#eadfce] bg-[linear-gradient(135deg,#fffaf2,#f3d9c9_45%,#dfe8dd)] shadow-[inset_0_0_0_6px_rgba(255,255,255,0.58),0_12px_26px_rgba(45,34,23,0.12)] transition duration-300 group-hover:-rotate-2 group-hover:scale-105 sm:h-14 sm:w-14">
            <Image src="/logo.svg" alt="Board logo" height={42} width={42} />
            <span className="animate-twinkle absolute right-1 top-1 text-[#d28a45]">✦</span>
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-black tracking-tight text-[#10233f] sm:text-3xl">IdeaBoard</h1>
            </div>
            <p className="mt-0.5 max-w-[340px] text-xs leading-5 text-[#657089] sm:text-sm">Draw, plan and brainstorm with your team</p>
          </div>
        </Link>

        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center xl:justify-center">
          <div className="flex shrink-0 rounded-[24px] border border-[#eadfce] bg-[#f8f3ea]/82 p-1 shadow-[inset_0_1px_2px_rgba(45,34,23,0.05)]">
            <Button
              variant="ghost"
              asChild
              className={cn(
                "h-11 flex-1 rounded-[21px] px-4 text-sm font-bold text-[#4d5a70] hover:bg-white hover:text-[#10233f] sm:flex-none",
                !favorites && "bg-white text-[#0b66b2] shadow-[0_10px_22px_rgba(45,34,23,0.10)]"
              )}
            >
              <Link href="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Boards
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className={cn(
                "h-11 flex-1 rounded-[21px] px-4 text-sm font-bold text-[#4d5a70] hover:bg-white hover:text-[#10233f] sm:flex-none",
                favorites && "bg-white text-[#b75c73] shadow-[0_10px_22px_rgba(45,34,23,0.10)]"
              )}
            >
              <Link href={{ pathname: "/", query: { favorites: true } }}>
                <Star className="mr-2 h-4 w-4" />
                Favorites
              </Link>
            </Button>
          </div>

          <SearchInput />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 xl:col-span-2 xl:justify-end 2xl:col-span-1 2xl:flex-nowrap">
          <div className="hidden shrink-0 items-center gap-2 rounded-[20px] border border-[#e8d2b2] bg-[#fff6e6] px-4 py-2.5 text-sm font-bold text-[#a1642b] shadow-[0_8px_18px_rgba(166,100,43,0.08)] xl:flex">
            <Palette className="h-4 w-4" />
            <span className="hidden 2xl:inline">Creative workspace</span>
            <span className="2xl:hidden">Workspace</span>
          </div>
          <InviteButton />
          <div className="flex min-w-0 items-center gap-2 rounded-[22px] border border-[#d6e8e5] bg-[#f3fbf9] px-3 py-2.5 text-sm text-[#40506b] shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1b8c76] text-xs font-black text-white">
              {(user?.email || "M").charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[155px] truncate sm:max-w-[230px] xl:max-w-[155px] 2xl:max-w-[240px]">{user?.email}</span>
          </div>
          <Button
            onClick={signOut}
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="shrink-0 rounded-2xl text-[#657089] hover:bg-[#fff3e3] hover:text-[#a1642b]"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
