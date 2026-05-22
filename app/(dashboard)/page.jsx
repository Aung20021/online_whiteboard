"use client";

import { BoardList } from "./_components/board-list";

const DashboardPage = ({ searchParams }) => {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-8 xl:px-9">
      <BoardList orgId="personal" query={searchParams || {}} />
    </div>
  );
};

export default DashboardPage;
