"use client";

import { completedTaskColumns } from "../tasks-table/columns";
import { DataTable } from "../tasks-table/data-table";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { usePaginatedQueryWithAuth } from "../helpers";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function Home() {
  const [term, _setTerm] = useState<string>("");
  const { results, status, loadMore } = usePaginatedQueryWithAuth(
    api.tasks.listCompletedTasksPaginated,
    { term },
    { initialNumItems: 5 }
  );

  return (
    <main className="container max-w-3xl flex flex-col gap-8">
      <div className="container mx-auto py-10">
        <h2 className="m-5">
          Tasks that have already been marked as completed.
        </h2>
        <DataTable columns={completedTaskColumns} data={results ?? []} />
        <div className="flex justify-center">
          <Button
            className="align-center m-2"
            variant="outline"
            onClick={() => loadMore(5)}
            disabled={status !== "CanLoadMore"}
          >
            {status !== "LoadingMore" && "Load More"}
            {status === "LoadingMore" && (
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
