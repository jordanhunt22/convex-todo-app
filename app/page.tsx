"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useQueryWithAuth } from "@convex-dev/convex-lucia-auth/react";

export default function Home() {
  return (
    <main className="container max-w-2xl flex flex-col gap-8">
      <HomePage />
    </main>
  );
}

function HomePage() {
  const activeTasksCount = useQueryWithAuth(api.tasks.activeTasksCount, {});
  const completedTasksCount = useQueryWithAuth(
    api.tasks.completedTasksCount,
    {}
  );

  return (
    <>
      <h1 className="flex gap-4 items-center">
        Welcome! Here, you can see a summary of all your tasks.
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Overdue tasks</CardTitle>
          <CardDescription>You have x overdue task(s).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Task 1</h4>
            <p className="text-sm text-muted-foreground">Description</p>
          </div>
          <Separator className="my-4" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Task 2</h4>
            <p className="text-sm text-muted-foreground">Description</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Currently active tasks</CardTitle>
          <CardDescription>
            You currently have {activeTasksCount} task(s) to complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Task 1</h4>
            <p className="text-sm text-muted-foreground">Description</p>
          </div>
          <Separator className="my-4" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Task 2</h4>
            <p className="text-sm text-muted-foreground">Description</p>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Completed tasks</CardTitle>
          <CardDescription>
            You have completed {completedTasksCount} task(s). Look below to see
            some highlights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Task 1</h4>
            <p className="text-sm text-muted-foreground">Description</p>
          </div>
          <Separator className="my-4" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Task 2</h4>
            <p className="text-sm text-muted-foreground">Description</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
