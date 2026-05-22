"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";

export const Item = ({ name, imageUrl }) => {
  return (
    <div className="relative aspect-square">
      <Hint label={name} side="right" align="start" sideOffset={18}>
        <Image
          fill
          alt={name}
          src={imageUrl}
          className={cn("cursor-pointer rounded-2xl bg-white p-1.5 opacity-100 shadow-md ring-2 ring-white/20 transition hover:scale-105")}
        />
      </Hint>
    </div>
  );
};
