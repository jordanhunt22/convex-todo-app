"use client";

import { useQueryWithAuth } from "@convex-dev/convex-lucia-auth/react";
import { completedTaskColumns } from "../tasks-table/columns";
import { DataTable } from "../tasks-table/data-table";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function Home() {
  const [term, _setTerm] = useState<string>("");
  const tasks = useQueryWithAuth(api.tasks.listCompletedTasks, { term });

  return (
    <main className="container max-w-2xl flex flex-col gap-8">
      <div className="container mx-auto py-10">
        <h2 className="m-5">
          Tasks that have already been marked as completed.
        </h2>
        <DataTable columns={completedTaskColumns} data={tasks ?? []} />
      </div>
    </main>
  );
}
