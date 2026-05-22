"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, PencilLine } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { boardApi } from "@/lib/boards";
import { Actions } from "@/components/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";

import { Footer } from "./footer";

export const BoardCard = ({
  id,
  title,
  authorId,
  authorName,
  createdAt,
  imageUrl,
  orgId,
  isFavorite,
}) => {
  const { user } = useSupabaseAuth();
  const [favorite, setFavorite] = useState(isFavorite);

  const authorLabel = user?.id === authorId ? "You" : authorName;
  const createdAtLabel = formatDistanceToNow(createdAt, { addSuffix: true });

  const { mutate: onFavorite, pending: pendingFavorite } = useApiMutation(boardApi.favorite);
  const { mutate: onUnfavorite, pending: pendingUnfavorite } = useApiMutation(boardApi.unfavorite);

  const toggleFavorite = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (favorite) {
      setFavorite(false);
      onUnfavorite({ id }).catch(() => {
        setFavorite(true);
        toast.error("Failed to unfavorite");
      });
    } else {
      setFavorite(true);
      onFavorite({ id, orgId }).catch(() => {
        setFavorite(false);
        toast.error("Failed to favorite");
      });
    }
  };

  return (
    <Link href={`/board/${id}`} className="min-w-0">
      <div className="animate-card-rise group overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_16px_36px_rgba(45,34,23,0.10)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1 hover:border-[#d7c6ae] hover:shadow-[0_22px_52px_rgba(45,34,23,0.14)] sm:rounded-[34px]">
        <div className="relative h-[165px] overflow-hidden rounded-b-[28px] border-b border-[#e6d9c8] bg-[#f4eadf] sm:h-[205px] sm:rounded-b-[32px]">
          <div className="absolute inset-0 opacity-[0.40] bg-[linear-gradient(rgba(40,55,74,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(40,55,74,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <Image src={imageUrl} alt={title} fill className="object-cover opacity-90 saturate-[0.78] transition duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:saturate-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,250,240,0.62),transparent_36%),linear-gradient(to_top,rgba(16,35,63,0.08),transparent)]" />
          <div className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/85 bg-white/88 px-3 py-1.5 text-xs font-black text-[#5b4ca0] shadow-sm backdrop-blur sm:left-4 sm:top-4">
            <PencilLine className="mr-1.5 h-3.5 w-3.5 text-[#a1642b]" />
            Board
          </div>
          <Actions id={id} title={title} side="right">
            <button className="absolute right-3 top-3 rounded-2xl border border-white/80 bg-white/90 p-2 text-[#40506b] opacity-100 outline-none shadow-sm backdrop-blur transition hover:bg-[#fff6e6] sm:right-4 sm:top-4 lg:opacity-0 lg:group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </Actions>
        </div>
        <Footer
          isFavorite={favorite}
          title={title}
          authorLabel={authorLabel}
          createdAtLabel={createdAtLabel}
          onClick={toggleFavorite}
          disabled={pendingFavorite || pendingUnfavorite}
        />
      </div>
    </Link>
  );
};

BoardCard.Skeleton = function BoardCardSkeleton() {
  return (
    <div className="min-h-[270px] overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffaf3] p-4 shadow-sm sm:min-h-[300px] sm:rounded-[34px]">
      <Skeleton className="h-full w-full rounded-[28px]" />
    </div>
  );
};
