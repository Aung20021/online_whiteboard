"use client";

import { toast } from "sonner";
import { ArrowUpRight, Plus, PencilRuler } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { boardApi } from "@/lib/boards";
import { useApiMutation } from "@/hooks/use-api-mutation";

export const NewBoardButton = ({ orgId, disabled }) => {
  const router = useRouter();
  const { mutate, pending } = useApiMutation(boardApi.create);

  const onClick = () => {
    mutate({ orgId, title: "Untitled" })
      .then((id) => {
        toast.success("Board created");
        router.push(`/board/${id}`);
      })
      .catch(() => toast.error("Failed to create board"));
  };

  return (
    <button
      disabled={pending || disabled}
      onClick={onClick}
      className={cn(
        "animate-card-rise group relative min-h-[270px] overflow-hidden rounded-[30px] border border-dashed border-[#dacbb9] bg-[linear-gradient(145deg,#fffaf2,#fff6ea)] p-5 text-left shadow-[0_16px_34px_rgba(45,34,23,0.08)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1 hover:border-[#c9a063]/70 hover:shadow-[0_22px_48px_rgba(45,34,23,0.13)] sm:min-h-[300px] sm:rounded-[34px]",
        (pending || disabled) && "cursor-not-allowed opacity-75 hover:translate-y-0"
      )}
    >
      <div className="absolute inset-0 opacity-[0.36] bg-[linear-gradient(rgba(40,55,74,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(40,55,74,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="animate-float-slower absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ead6e6]/55" />
      <div className="animate-float-slow absolute bottom-7 right-8 h-20 w-20 rounded-full bg-[#f3df91]/55" />
      <svg className="animate-draw-line absolute bottom-28 left-6 h-16 w-48 text-[#7e715f]/30" viewBox="0 0 210 80" fill="none" aria-hidden="true">
        <path d="M5 48 C44 14 75 72 116 34 C150 2 174 42 205 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="7 8" />
        <path d="M110 60 L160 35 L142 76" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e3d6c4] bg-white/86 text-[#10233f] shadow-[0_12px_24px_rgba(45,34,23,0.10)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-16 sm:w-16">
            <Plus className="h-7 w-7 stroke-[2] sm:h-8 sm:w-8" />
          </div>
          <div className="rounded-full border border-[#e8d2b2] bg-[#fff3df]/95 p-3 text-[#a1642b] shadow-sm transition duration-300 group-hover:rotate-12 group-hover:scale-105">
            <PencilRuler className="h-5 w-5" />
          </div>
        </div>

        <div>
          <p className="text-2xl font-black leading-tight text-[#10233f]">Create a new idea space</p>
          <p className="mt-3 max-w-[245px] text-sm leading-6 text-[#657089]">
            Start with a blank canvas for sketches, sticky notes and team planning.
          </p>
          <div className="mt-6 inline-flex items-center rounded-[18px] border border-[#10233f] bg-[#10233f] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,35,63,0.20)] transition duration-300 group-hover:bg-[#17345d]">
            Open canvas
            <ArrowUpRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
};
