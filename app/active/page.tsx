"use client";

import { useQueryWithAuth } from "@convex-dev/convex-lucia-auth/react";
import { columns } from "../tasks-table/columns";
import { DataTable } from "../tasks-table/data-table";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { TaskInputForm } from "../components/task-form";
import { usePaginatedQueryWithAuth } from "../helpers";

export default function Home() {
  const [term, setTerm] = useState<string>("");
  const { results, status, loadMore } = usePaginatedQueryWithAuth(
    api.tasks.listActiveTasksPaginated,
    { term },
    { initialNumItems: 5 }
  );

  return (
    <main className="container max-w-3xl flex flex-col gap-8">
      <div className="container mx-auto py-10">
        <div className="flex mb-3">
          <Input
            className="mr-2 w-48"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Filter tasks..."
          />
          <AddTask />
        </div>
        <DataTable columns={columns} data={results ?? []} />
        <div className="flex justify-center">
          <Button
            className="align-center m-2"
            variant="outline"
            onClick={() => loadMore(5)}
            disabled={status !== "CanLoadMore"}
          >
            Load More
          </Button>
        </div>
      </div>
    </main>
  );
}

export function AddTask() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2" />
          Add a task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            Create a new task to add to your list.
          </DialogDescription>
        </DialogHeader>
        <TaskInputForm />
      </DialogContent>
    </Dialog>
  );
}
