"use client";

import { Item } from "./item";

export const List = () => {
  return (
    <ul className="space-y-4">
      <Item id="personal" name="Personal workspace" imageUrl="/logo.svg" />
    </ul>
  );
};
