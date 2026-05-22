import { ArrowUpRight, Star } from "lucide-react";

import { cn } from "@/lib/utils";

export const Footer = ({ title, authorLabel, createdAtLabel, isFavorite, onClick, disabled }) => {
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    onClick?.(event);
  };

  return (
    <div className="relative bg-[#fffaf3] p-4">
      <button
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "absolute right-4 top-4 rounded-2xl border border-transparent p-2 text-[#9aa3b4] transition duration-300 hover:scale-105 hover:border-[#eadbb9] hover:bg-[#fff6dc] hover:text-[#b27b2e]",
          isFavorite && "border-[#eadbb9] bg-[#fff6dc] text-[#b27b2e]",
          disabled && "cursor-not-allowed opacity-75"
        )}
        aria-label="Toggle favourite"
      >
        <Star className={cn("h-4 w-4", isFavorite && "fill-[#d8a545] text-[#b27b2e]")} />
      </button>

      <div className="pr-10">
        <p className="truncate text-[16px] font-black text-[#10233f]">{title}</p>
        <p className="mt-1 truncate text-xs font-medium text-[#657089]">
          {authorLabel} • {createdAtLabel}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[18px] border border-[#e4dbef] bg-[#f3effc] px-3 py-2.5 text-xs font-bold text-[#5b4ca0] transition duration-300 group-hover:bg-[#ede7fb]">
        Continue editing
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </div>
  );
};
