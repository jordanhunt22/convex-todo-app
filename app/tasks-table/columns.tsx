"use client";

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
import { Id } from "@/convex/_generated/dataModel";
import { useMutationWithAuth } from "@convex-dev/convex-lucia-auth/react";
import { ColumnDef, Row } from "@tanstack/react-table";

export type Task = {
  _id: Id<"tasks">;
  title: string;
  completed_at?: number;
  due_date: string;
  description?: string;
};

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
    accessorKey: "due_date",
    header: "Due date",
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
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
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
      accessorKey: "completed_at",
      header: "Completed on",
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
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
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
