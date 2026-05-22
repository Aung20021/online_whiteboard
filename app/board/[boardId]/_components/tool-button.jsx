"use client";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";

export const ToolButton = ({ label, icon: Icon, onClick, isActive, isDisabled, side = "bottom" }) => {
  return (
    <Hint label={label} side={side} sideOffset={10}>
      <Button
        disabled={isDisabled}
        onClick={onClick}
        size="icon"
        variant={isActive ? "boardActive" : "board"}
        className={`h-10 w-10 shrink-0 rounded-xl border transition-all duration-150 ${
          isActive
            ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
            : "border-transparent bg-transparent text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
        }`}
      >
        <Icon className="h-5 w-5" />
      </Button>
    </Hint>
  );
};
