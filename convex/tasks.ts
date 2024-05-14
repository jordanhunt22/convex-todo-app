import { defineTable, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
  getAuth,
  getValidSessionAndRenew,
} from "@convex-dev/convex-lucia-auth";
import {
  DatabaseWriter,
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions.js";

export const table = {
  tasks: defineTable({
    // Title of a task
    title: v.string(),

    // Description of what a task entails
    description: v.optional(v.string()),

    // Due date string of a task
    due_date: v.string(),

    // Due date in milliseconds since epoch
    date_number: v.optional(v.number()),

    // Completion data in milliseconds since epoch
    completed_at: v.optional(v.number()),

    // Categories associated with a task
    categories: v.array(v.string()),

    // The owner id of a task
    owner: v.id("users"),

    // Embedding of the task contents
    embedding: v.optional(v.array(v.number())),
  })
    .index("by_owner_and_completed", ["owner", "completed_at"])
    .index("by_owner_and_completed_and_due_date", [
      "owner",
      "completed_at",
      "date_number",
    ])
    .index("by_owner", ["owner"])
    .searchIndex("by_title", {
      searchField: "title",
      filterFields: ["owner", "completed_at"],
    })
    .vectorIndex("byEmbedding", {
      vectorField: "embedding",
      filterFields: ["owner", "completed_at"],
      dimensions: 1536,
    }),
};

const authQuery = customQuery(query, {
  args: { sessionId: v.union(v.string(), v.null()) },
  input: async (ctx, args) => {
    const auth = getAuth(ctx.db as DatabaseWriter);
    const session = await getValidSessionAndRenew(auth, args.sessionId);
    if (!session?.user._id) throw new Error("Authentication required");

    return {
      ctx: { ...ctx, session, auth, userId: session?.user._id },
      args: {},
    };
  },
});

const authMutation = customMutation(mutation, {
  args: { sessionId: v.union(v.string(), v.null()) },
  input: async (ctx, args) => {
    const auth = getAuth(ctx.db as DatabaseWriter);
    const session = await getValidSessionAndRenew(auth, args.sessionId);
    if (!session?.user._id) throw new Error("Authentication required");

    return {
      ctx: { ...ctx, session, auth, userId: session?.user._id },
      args: {},
    };
  },
});

export const addTask = authMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    due_date: v.string(),
    due_date_num: v.number(),
    completed_at: v.optional(v.number()),
    categories: v.optional(v.array(v.string()))
  },

  handler: async (ctx, args) => {
    const task = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      due_date: args.due_date,
      completed_at: args.completed_at,
      owner: ctx.userId,
      date_number: args.due_date_num,
      categories: args.categories ?? [],
    });
    await ctx.scheduler.runAfter(0, internal.tasks.populateEmbedding, {
      taskId: task,
      taskName: args.title,
      taskDescription: args.description,
    });

    return task;
  },
});

export const completeTask = authMutation({
  args: {
    id: v.id("tasks"),
    completed: v.boolean(),
  },

  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);

    if (task) {
      if (args.completed && !task.completed_at && task.owner === ctx.userId) {
        await ctx.db.patch(args.id, { completed_at: new Date().getTime() });
      } else if (!args.completed && task.completed_at) {
        await ctx.db.patch(args.id, { completed_at: undefined });
      }
      console.log("done");
    }
  },
});

export const removeTask = authMutation({
  args: {
    id: v.id("tasks"),
  },

  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);

    if (task && task.owner === ctx.userId) {
      await ctx.db.delete(task._id);
    }
  },
});

export const listActiveTasks = authQuery({
  args: { term: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let query;

    if (args.term === "") {
      query = ctx.db
        .query("tasks")
        .withIndex("by_owner_and_completed", (q) =>
          q.eq("owner", ctx.userId).eq("completed_at", undefined)
        );
    } else {
      query = ctx.db
        .query("tasks")
        .withSearchIndex("by_title", (q) =>
          q
            .search("title", args.term)
            .eq("owner", ctx.userId)
            .eq("completed_at", undefined)
        );
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const listActiveTasksPaginated = authQuery({
  args: { term: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    let query;

    if (args.term === "") {
      query = ctx.db
        .query("tasks")
        .withIndex("by_owner_and_completed", (q) =>
          q.eq("owner", ctx.userId).eq("completed_at", undefined)
        );
    } else {
      query = ctx.db
        .query("tasks")
        .withSearchIndex("by_title", (q) =>
          q
            .search("title", args.term)
            .eq("owner", ctx.userId)
            .eq("completed_at", undefined)
        );
    }

    return await query.paginate(args.paginationOpts);
  },
});

export const activeTasksCount = authQuery({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner_and_completed", (q) =>
        q.eq("owner", ctx.userId).eq("completed_at", undefined)
      )
      .collect();

    return tasks.length;
  },
});

export const listOverdueTasks = authQuery({
  args: { term: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let query;

    if (args.term === "") {
      query = ctx.db
        .query("tasks")
        .withIndex("by_owner_and_completed_and_due_date", (q) =>
          q
            .eq("owner", ctx.userId)
            .eq("completed_at", undefined)
            .lt("date_number", new Date().getTime())
        );
    } else {
      query = ctx.db
        .query("tasks")
        .withSearchIndex("by_title", (q) =>
          q
            .search("title", args.term)
            .eq("owner", ctx.userId)
            .eq("completed_at", undefined)
        );
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const overdueTasksCount = authQuery({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner_and_completed_and_due_date", (q) =>
        q
          .eq("owner", ctx.userId)
          .eq("completed_at", undefined)
          .lt("date_number", new Date().getTime())
      )
      .collect();

    return tasks.length;
  },
});

export const listCompletedTasks = authQuery({
  args: { term: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let query;

    if (args.term === "") {
      query = ctx.db
        .query("tasks")
        .withIndex("by_owner", (q) => q.eq("owner", ctx.userId))
        .filter((q) => q.neq(q.field("completed_at"), undefined));
    } else {
      query = ctx.db
        .query("tasks")
        .withSearchIndex("by_title", (q) =>
          q.search("title", args.term).eq("owner", ctx.userId)
        )
        .filter((q) => q.neq(q.field("completed_at"), undefined));
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const listCompletedTasksPaginated = authQuery({
  args: { term: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    let query;

    if (args.term === "") {
      query = ctx.db
        .query("tasks")
        .withIndex("by_owner", (q) => q.eq("owner", ctx.userId))
        .filter((q) => q.neq(q.field("completed_at"), undefined));
    } else {
      query = ctx.db
        .query("tasks")
        .withSearchIndex("by_title", (q) =>
          q.search("title", args.term).eq("owner", ctx.userId)
        )
        .filter((q) => q.neq(q.field("completed_at"), undefined));
    }

    return await query.paginate(args.paginationOpts);
  },
});

export const completedTasksCount = authQuery({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (q) => q.eq("owner", ctx.userId))
      .filter((q) => q.neq(q.field("completed_at"), undefined))
      .collect();

    return tasks.length;
  },
});

export const addEmbedding = internalMutation({
  args: { taskId: v.id("tasks"), embedding: v.array(v.number()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { embedding: args.embedding });
  },
});

export const populateEmbedding = internalAction({
  args: {
    taskId: v.id("tasks"),
    taskName: v.string(),
    taskDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const openai = new OpenAI();
    const { data } = await openai.embeddings.create({
      input: [`${args.taskName}${args.taskDescription}`],
      model: "text-embedding-ada-002",
    });
    await ctx.runMutation(internal.tasks.addEmbedding, {
      taskId: args.taskId,
      embedding: data[0].embedding,
    });
  },
});
