"use client";

import { useEffect, useState } from "react";
import { BookOpen, Brush, Heart, LayoutGrid, Lightbulb, Pencil, Sparkles, Users } from "lucide-react";

import { getBoards } from "@/lib/boards";
import { BoardCard } from "./board-card";
import { EmptySearch } from "./empty-search";
import { EmptyBoards } from "./empty-boards";
import { EmptyFavorites } from "./empty-favorites";
import { NewBoardButton } from "./new-board-button";

const MiniCard = ({ icon: Icon, label, value, tone = "blue", delay = "" }) => {
  const tones = {
    blue: "border-[#d8e3ed] bg-[linear-gradient(135deg,#f8fbfe,#e7f1f8)] text-[#4e7f9d]",
    rose: "border-[#edd8d7] bg-[linear-gradient(135deg,#fff9f9,#fae8ec)] text-[#be5f73]",
    sage: "border-[#dce7d2] bg-[linear-gradient(135deg,#fbfdf8,#edf6e7)] text-[#66845a]",
    gold: "border-[#eadbb9] bg-[linear-gradient(135deg,#fffdf5,#fff1cc)] text-[#b27b2e]",
  };

  const doodles = {
    blue: <path d="M14 82 C52 44 82 102 120 64 C148 36 168 48 190 24" />,
    rose: <path d="M92 80 C84 54 116 42 128 62 C140 40 176 52 164 82 C154 108 126 118 126 118 C126 118 102 107 92 80Z" />,
    sage: <path d="M114 120 C108 76 124 44 158 22 M122 86 C138 86 150 76 160 58 M116 104 C96 104 86 92 80 76" />,
    gold: <path d="M94 110 C122 88 130 98 140 78 C152 54 170 58 176 68 M150 92 L184 72 L166 116" />,
  };

  return (
    <div className={`animate-card-rise relative min-h-[135px] overflow-hidden rounded-[24px] border p-5 shadow-[0_16px_38px_rgba(45,34,23,0.10)] ring-1 ring-white/75 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(45,34,23,0.13)] sm:min-h-[150px] sm:rounded-[30px] ${tones[tone]} ${delay}`}>
      <svg className="absolute bottom-2 right-2 h-24 w-36 opacity-30" viewBox="0 0 200 140" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 8">
          {doodles[tone]}
        </g>
      </svg>
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/82 shadow-[0_10px_20px_rgba(45,34,23,0.09)] backdrop-blur">
        <Icon className="h-5 w-5" />
      </div>
      <p className="relative text-3xl font-black text-[#10233f]">{value}</p>
      <p className="relative mt-1 text-sm font-medium capitalize text-[#5c687b]">{label}</p>
    </div>
  );
};

export const BoardList = ({ orgId, query }) => {
  const [data, setData] = useState(undefined);
  const search = query?.search;
  const favoritesParam = query?.favorites;
  const isFavorites = Boolean(favoritesParam);
  const title = isFavorites ? "Favourite boards" : "Creative boards";

  useEffect(() => {
    let mounted = true;
    setData(undefined);
    getBoards({ orgId, search, favorites: favoritesParam })
      .then((boards) => {
        if (mounted) setData(boards);
      })
      .catch(() => {
        if (mounted) setData([]);
      });

    return () => {
      mounted = false;
    };
  }, [orgId, search, favoritesParam]);

  const boardCount = data?.length ?? 0;
  const favoriteCount = data?.filter((board) => board.isFavorite).length ?? 0;

  const header = (
    <div className="mb-7 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.95fr)] xl:gap-6">
      <div className="animate-soft-enter relative min-h-[300px] overflow-hidden rounded-[32px] border border-white/75 bg-[linear-gradient(135deg,#fff9ef_0%,#fff7ed_52%,#f3f6ed_100%)] p-6 text-[#10233f] shadow-[0_24px_62px_rgba(45,34,23,0.13)] ring-1 ring-[#eadfce]/75 sm:min-h-[330px] sm:rounded-[40px] sm:p-8 lg:min-h-[360px] xl:p-10">
        <div className="absolute inset-0 opacity-[0.45] bg-[radial-gradient(circle_at_center,rgba(68,47,25,0.08)_1px,transparent_1px)] bg-[size:18px_18px]" />
        <div className="absolute -left-12 bottom-12 h-44 w-44 rounded-full bg-[#d9bfd4]/34 blur-[1px]" />
        <div className="animate-float-slower absolute -right-10 -top-8 h-48 w-48 rounded-[42%] bg-[#d9e2d3]/65 blur-[0.4px]" />
        <div className="animate-float-slow absolute bottom-8 right-8 h-24 w-24 rounded-full bg-[#f1e7f5]/65" />
        <div className="absolute right-16 top-24 h-28 w-28 rotate-[24deg] rounded-full border border-[#d7b985]/30" />
        <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        <svg className="absolute left-4 top-14 h-48 w-40 text-[#7e715f]/36 sm:left-8" viewBox="0 0 160 190" fill="none" aria-hidden="true">
          <path d="M84 176 C66 116 72 64 118 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M81 143 C54 138 42 126 36 106 M82 120 C111 116 124 102 130 82 M79 98 C56 96 46 84 40 66 M91 76 C112 74 126 61 134 44 M96 58 C84 48 80 36 84 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <svg className="animate-draw-line absolute bottom-8 right-8 h-28 w-[72%] text-[#7e715f]/32" viewBox="0 0 650 130" fill="none" aria-hidden="true">
          <path d="M8 96 C82 60 142 120 226 72 C334 10 402 118 486 66 C538 34 584 40 640 18" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeDasharray="8 10" />
          <path d="M462 56 C493 44 516 40 536 44" stroke="#c9a063" strokeWidth="5" strokeLinecap="round" opacity="0.46" />
        </svg>
        <div className="absolute bottom-20 left-20 hidden h-2 w-2 rounded-full bg-[#d4a24f]/55 sm:block" />
        <div className="absolute bottom-28 left-28 hidden h-1.5 w-1.5 rounded-full bg-[#d4a24f]/55 sm:block" />
        <div className="absolute bottom-16 left-36 hidden h-1 w-1 rounded-full bg-[#d4a24f]/55 sm:block" />

        <div className="relative flex h-full max-w-3xl flex-col justify-center sm:pl-20 md:pl-28 xl:pl-36">
          <h2 className="text-4xl font-black tracking-tight text-[#10233f] sm:text-5xl md:text-6xl xl:text-[4.2rem]">{title}</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#435169] sm:text-lg sm:leading-8">
            Create group whiteboards, save favorites and jump back into teamwork from one bright, beautiful home.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold sm:text-base">
            <span className="inline-flex items-center rounded-full border border-[#dce7d2] bg-[#eef5e8]/90 px-5 py-2.5 text-[#516b47] shadow-[0_10px_22px_rgba(45,34,23,0.07)]">
              <Lightbulb className="mr-2 h-4 w-4" />
              Brainstorm
            </span>
            <span className="inline-flex items-center rounded-full border border-[#ddd3ec] bg-[#f0eaf8]/90 px-5 py-2.5 text-[#5b4ca0] shadow-[0_10px_22px_rgba(45,34,23,0.07)]">
              <Pencil className="mr-2 h-4 w-4" />
              Sketch
            </span>
            <span className="inline-flex items-center rounded-full border border-[#efdabb] bg-[#fff0d8]/90 px-5 py-2.5 text-[#9a6730] shadow-[0_10px_22px_rgba(45,34,23,0.07)]">
              <Users className="mr-2 h-4 w-4" />
              Collaborate
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:auto-rows-fr xl:gap-5">
        <MiniCard icon={LayoutGrid} label="Boards" value={data === undefined ? "..." : boardCount} tone="blue" />
        <MiniCard icon={Heart} label="Favorites" value={data === undefined ? "..." : favoriteCount} tone="rose" delay="animation-delay-100" />
        <MiniCard icon={Users} label="Workspace" value="Team" tone="sage" delay="animation-delay-200" />
        <MiniCard icon={BookOpen} label="Mode" value="Study" tone="gold" delay="animation-delay-300" />
      </div>
    </div>
  );

  if (data === undefined) {
    return (
      <div>
        {header}
        <div className="mb-5 flex items-center gap-x-2 text-[#10233f]">
          <Sparkles className="h-5 w-5 text-[#c9a063]" />
          <h3 className="text-xl font-black">Loading workspace...</h3>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 pb-10 2xl:grid-cols-4">
          <NewBoardButton orgId={orgId} disabled />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
        </div>
      </div>
    );
  }

  if (!data?.length && search) return <><div>{header}</div><EmptySearch /></>;
  if (!data?.length && favoritesParam) return <><div>{header}</div><EmptyFavorites /></>;
  if (!data?.length) return <><div>{header}</div><EmptyBoards /></>;

  return (
    <div>
      {header}
      <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-white/70 p-4 shadow-[0_20px_58px_rgba(45,34,23,0.09)] ring-1 ring-[#eadfce]/70 backdrop-blur sm:rounded-[36px] sm:p-6">
        <div className="absolute inset-0 opacity-[0.28] bg-[linear-gradient(rgba(40,55,74,0.034)_1px,transparent_1px),linear-gradient(90deg,rgba(40,55,74,0.024)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-x-2 text-[#10233f]">
              {isFavorites ? <Heart className="h-5 w-5 fill-[#be5f73] text-[#be5f73]" /> : <Sparkles className="h-5 w-5 text-[#c9a063]" />}
              <h3 className="text-2xl font-black sm:text-3xl">{isFavorites ? "Saved favorites" : "Continue creating"}</h3>
            </div>
            <p className="mt-1 text-sm text-[#657089]">Pick up where you left off or start something new.</p>
          </div>
          <p className="w-fit rounded-full border border-[#eadfce] bg-white/82 px-5 py-2.5 text-sm font-bold text-[#10233f] shadow-[0_9px_22px_rgba(45,34,23,0.08)]">
            {boardCount} board{boardCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 pb-2 2xl:grid-cols-4">
          <NewBoardButton orgId={orgId} />
          {data.map((board) => (
            <BoardCard
              key={board._id}
              id={board._id}
              title={board.title}
              imageUrl={board.imageUrl}
              authorId={board.authorId}
              authorName={board.authorName}
              createdAt={board._creationTime}
              orgId={board.orgId}
              isFavorite={board.isFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
