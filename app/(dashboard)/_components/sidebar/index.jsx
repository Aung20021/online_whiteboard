import { List } from "./list";
import { NewButton } from "./new-button";

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 z-[1] flex h-full w-[72px] flex-col gap-y-4 bg-[#1d2b6d] p-3 text-white shadow-[10px_0_35px_rgba(29,43,109,0.2)]">
      <List />
      <NewButton />
    </aside>
  );
};
