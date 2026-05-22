"use client";

import qs from "query-string";
import { Search } from "lucide-react";
import { useDebounce } from "usehooks-ts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

export const SearchInput = () => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 500);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    const url = qs.stringifyUrl(
      {
        url: "/",
        query: {
          search: debouncedValue,
        },
      },
      { skipEmptyString: true, skipNull: true }
    );
    router.push(url);
  }, [debouncedValue, router]);

  return (
    <div className="relative w-full min-w-0 sm:w-[260px] sm:max-w-[320px] xl:w-[230px] 2xl:w-[280px]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#28445c]" />
      <Input
        className="h-11 w-full rounded-[22px] border-[#eadfce] bg-white/82 pl-12 pr-4 text-sm text-[#10233f] shadow-[0_8px_18px_rgba(45,34,23,0.08)] transition placeholder:text-[#8a93a3] focus-visible:ring-[#8e77f0]"
        placeholder="Search boards"
        onChange={handleChange}
        value={value}
      />
    </div>
  );
};
