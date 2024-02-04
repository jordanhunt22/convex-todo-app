"use client";

import { SetStateAction, startTransition, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useSignOut } from "@convex-dev/convex-lucia-auth/react";

export default function Tabs({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tab, setTab] = useState("");
  const pathname = usePathname();
  const signOut = useSignOut();

  useEffect(() => {
    setTab(pathname.substring(1));
  }, [pathname]);

  function selectTab(nextTab: SetStateAction<string>) {
    startTransition(() => {
      router.push(`/${nextTab.toString()}`);
    });
  }

  return (
    <>
      <div className="flex justify-center">
        <TabButton isActive={tab === ""} onClick={() => selectTab("")}>
          Home
        </TabButton>
        <TabButton
          isActive={tab === "active"}
          onClick={() => selectTab("active")}
        >
          Active
        </TabButton>
        <TabButton
          isActive={tab === "completed"}
          onClick={() => selectTab("completed")}
        >
          Completed
        </TabButton>
        <TabButton isActive={false} onClick={signOut}>
          Log Out
        </TabButton>
      </div>
      {children}
      <Toaster />{" "}
    </>
  );
}

function TabButton({
  children,
  isActive,
  onClick,
}: {
  children: string;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  onClick: Function;
}) {
  const variant = isActive ? "default" : "ghost";
  return (
    <Button
      className="m-3 p-3 rounded-md"
      variant={variant}
      onClick={() => {
        if (!isActive) {
          onClick();
        }
      }}
    >
      {children}
    </Button>
  );
}
