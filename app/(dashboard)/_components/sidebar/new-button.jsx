"use client";

import { Plus } from "lucide-react";
import { Hint } from "@/components/hint";

export const NewButton = () => {
  return (
    <div className="aspect-square">
      <Hint label="Create board from main area" side="right" align="start" sideOffset={18}>
        <button className="bg-white/25 h-full w-full rounded-md flex items-center justify-center opacity-60 hover:opacity-100 transition">
          <Plus className="text-white" />
        </button>
      </Hint>
    </div>
  );
};
