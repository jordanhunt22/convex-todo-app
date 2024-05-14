import { useSessionId } from "@convex-dev/convex-lucia-auth/react";
import {
  PaginatedQueryReference,
  UsePaginatedQueryReturnType,
  usePaginatedQuery,
} from "convex/react";
import { FunctionReference } from "convex/server";

export function usePaginatedQueryWithAuth<
  Args extends { sessionId: string | null },
  Query extends PaginatedQueryReference &
    FunctionReference<"query", "public", Args>
>(
  query: Query,
  args: Omit<Omit<Query["_args"], "sessionId">, "paginationOpts">,
  options: { initialNumItems: number }
): UsePaginatedQueryReturnType<Query> {
  const sessionId = useSessionId();
  return usePaginatedQuery(query, { ...args, sessionId } as any, options);
}
