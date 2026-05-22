"use client";

import Link from "next/link";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { LayoutDashboard, Palette, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const font = Poppins({ subsets: ["latin"], weight: ["600"] });

export const OrgSidebar = () => {
  const searchParams = useSearchParams();
  const favorites = searchParams.get("favorites");

  return (
    <div className="hidden w-[232px] shrink-0 flex-col rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_18px_50px_rgba(59,130,246,0.12)] backdrop-blur-xl lg:flex">
      <Link href="/">
        <div className="flex items-center gap-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-200 via-pink-200 to-sky-200 shadow-inner">
            <Image src="/logo.svg" alt="Logo" height={42} width={42} />
          </div>
          <div>
            <span className={cn("text-2xl font-semibold text-slate-900", font.className)}>Board</span>
            <p className="text-xs text-slate-500">creative workspace</p>
          </div>
        </div>
      </Link>

      <div className="mt-8 rounded-3xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
          <Palette className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Personal workspace</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Create ideas, sketches and team notes in one happy place.</p>
      </div>

      <div className="mt-6 space-y-2">
        <Button
          variant="ghost"
          asChild
          size="lg"
          className={cn(
            "h-12 justify-start rounded-2xl px-3 font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-700",
            !favorites && "bg-sky-100 text-sky-700 shadow-sm hover:bg-sky-100"
          )}
        >
          <Link href="/">
            <LayoutDashboard className="mr-3 h-4 w-4" />
            Team boards
          </Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          size="lg"
          className={cn(
            "h-12 justify-start rounded-2xl px-3 font-medium text-slate-600 hover:bg-pink-50 hover:text-pink-700",
            favorites && "bg-pink-100 text-pink-700 shadow-sm hover:bg-pink-100"
          )}
        >
          <Link href={{ pathname: "/", query: { favorites: true } }}>
            <Star className="mr-3 h-4 w-4" />
            Favorite boards
          </Link>
        </Button>
      </div>

      <div className="mt-auto rounded-3xl bg-slate-900 p-4 text-white shadow-lg">
        <p className="text-sm font-semibold">Tip of the day</p>
        <p className="mt-1 text-xs leading-5 text-white/70">Use colours and sticky notes to group similar ideas quickly.</p>
      </div>
    </div>
  );
};
