"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutationWithAuth } from "@convex-dev/convex-lucia-auth/react";
import { DialogClose } from "@radix-ui/react-dialog";
import { TrashIcon } from "@radix-ui/react-icons";
import { ColumnDef, Row } from "@tanstack/react-table";

export type Task = Doc<"tasks">;

export const columns: ColumnDef<Task>[] = [
  {
    id: "completed",
    cell: ({ row }) => <TaskCheckbox row={row}></TaskCheckbox>,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    header: "Categories",
    cell: ({ row }) => <TaskCategories row={row}></TaskCategories>,
  },
  {
    accessorKey: "completed_at",
    header: "Completed on",
    cell: ({ row }) => (
      <>
        {row.original.date_number
          ? new Date(row.original.date_number).toDateString()
          : ""}
      </>
    ),
  },
  {
    id: "description",
    cell: ({ row }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">View description</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{row.original.title}</DialogTitle>
            <DialogDescription>
              View the details of your task below.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Due date</Label>
            <div>{row.original.due_date}</div>
          </div>
          <div>
            <Label>Description</Label>
            <div>{row.original.description}</div>
          </div>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    id: "delete",
    cell: ({ row }) => <TaskDelete row={row}></TaskDelete>,
  },
];

export const completedTaskColumns: ColumnDef<Task>[] = [
  {
    id: "completed",
    cell: ({ row }) => <TaskCheckbox row={row}></TaskCheckbox>,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    header: "Completed on",
    cell: ({ row }) => (
      <>
        {row.original.completed_at
          ? new Date(row.original.completed_at).toDateString()
          : ""}
      </>
    ),
  },
  {
    id: "description",
    cell: ({ row }) => <TaskDelete row={row}></TaskDelete>,
  },
];

function TaskCheckbox({ row }: { row: Row<Task> }) {
  const completeTask = useMutationWithAuth(api.tasks.completeTask);

  return (
    <Checkbox
      checked={row.original.completed_at !== undefined}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onCheckedChange={async (value) =>
        await completeTask({
          id: row.original._id,
          completed: value as boolean,
        })
      }
      aria-label="Select row"
    />
  );
}

function TaskCategories({ row }: { row: Row<Task> }) {
  return (
    <>
      {row.original.categories.map((cat) => (
        <Badge className="m-1" variant="default">
          {cat}
        </Badge>
      ))}
    </>
  );
}

function TaskDelete({ row }: { row: Row<Task> }) {
  const removeTask = useMutationWithAuth(api.tasks.removeTask);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <TrashIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete the task "{row.original.title}"?
          </DialogTitle>
        </DialogHeader>
        <div>
          <Label>Due date</Label>
          <div>{row.original.due_date}</div>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose>
            <Button
              variant="destructive"
              onClick={() => removeTask({ id: row.original._id })}
            >
              Confirm
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
