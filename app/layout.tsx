"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useMutationWithAuth,
  useSessionId,
  useSignUpSignIn,
} from "@convex-dev/convex-lucia-auth/react";
import { api } from "@/convex/_generated/api";
import Tabs from "./components/tabs";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "My App Title",
//   description: "An AI todo app built on Convex!",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          <h1 className="text-4xl font-extrabold my-8 text-center">
            To Do App
          </h1>
          <AuthForm>{children}</AuthForm>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

function AuthForm({ children }: { children: React.ReactNode }) {
  const sessionId = useSessionId();
  const { flow, toggleFlow, error, onSubmit } = useSignUpSignIn({
    signIn: useMutationWithAuth(api.auth.signIn),
    signUp: useMutationWithAuth(api.auth.signUp),
  });

  return sessionId ? (
    <Tabs>{children}</Tabs>
  ) : (
    <div className="flex flex-col items-center px-20 gap-4">
      <form
        className="flex flex-col w-[18rem]"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <label htmlFor="username">Email</label>
        <Input name="email" id="email" className="mb-4" />
        <label htmlFor="password">Password</label>
        <Input
          type="password"
          name="password"
          id="password"
          className="mb-4 "
        />
        <Button type="submit">
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <Button variant="link" onClick={toggleFlow}>
        {flow === "signIn"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </Button>
      <div className="font-medium text-sm text-red-500">
        {error !== undefined
          ? flow === "signIn"
            ? "Could not sign in, did you mean to sign up?"
            : "Could not sign up, did you mean to sign in?"
          : null}
      </div>
    </div>
  );
}
