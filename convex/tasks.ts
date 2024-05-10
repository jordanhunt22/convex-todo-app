import { defineTable } from "convex/server";
import { v } from "convex/values";
import { queryWithAuth, mutationWithAuth } from "@convex-dev/convex-lucia-auth";
import { internalAction, internalMutation } from "./_generated/server";
import OpenAI from "openai";
import { internal } from "./_generated/api";

export const table = {
    tasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        due_date: v.string(),
        date_number: v.optional(v.number()),
        completed_at: v.optional(v.number()),
        owner: v.id("users"),
        embedding: v.optional(v.array(v.number())),
    }).index("by_owner_and_completed", ["owner", "completed_at"]).index("by_owner_and_completed_and_due_date", ["owner", "completed_at", "date_number"]).index("by_owner", ["owner"]).searchIndex("by_title", {
        searchField: "title", filterFields: ["owner", "completed_at"]
    }).vectorIndex("byEmbedding", {
        vectorField: "embedding",
        filterFields: ["owner", "completed_at"],
        dimensions: 1536,
    }),
}

export const addTask = mutationWithAuth({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        due_date: v.string(),
        due_date_num: v.number(),
        completed_at: v.optional(v.number()),
    },

    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const task = await ctx.db.insert("tasks", { title: args.title, description: args.description, due_date: args.due_date, completed_at: args.completed_at, owner: ctx.session?.user._id, date_number: args.due_date_num });
        await ctx.scheduler.runAfter(0, internal.tasks.populateEmbedding, { taskId: task, taskName: args.title, taskDescription: args.description })

        return task;
    },
});

export const completeTask = mutationWithAuth({
    args: {
        id: v.id("tasks"),
        completed: v.boolean(),
    },

    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const task = await ctx.db.get(args.id);

        if (task) {
            console.log("here task");
            console.log("completed arg ", args.completed, "completed_at ", !task.completed_at, String(task.owner), ctx.session.user.userId)
            if (args.completed && !task.completed_at && task.owner === ctx.session.user._id) {
                console.log("patched with time");
                await ctx.db.patch(args.id, { completed_at: (new Date()).getTime() });
            }
            else if (!args.completed && task.completed_at) {
                console.log("patched remove time");
                await ctx.db.patch(args.id, { completed_at: undefined });
            }
            console.log("done")
        }
    }
})

export const removeTask = mutationWithAuth({
    args: {
        id: v.id("tasks"),
    },

    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        console.log("here1");

        const task = await ctx.db.get(args.id);

        console.log("here2");

        if (task && task.owner === ctx.session.user.userId) {
            await ctx.db.delete(task._id);

            console.log("here3");
        }

        console.log("here4");
    }
})

export const listActiveTasks = queryWithAuth({
    args: { term: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;
        let query;

        if (args.term === "") {
            query = ctx.db.query("tasks").withIndex("by_owner_and_completed", (q) => q.eq("owner", user_id).eq("completed_at", undefined));
        } else {
            query = ctx.db.query("tasks").withSearchIndex("by_title", (q) => q.search("title", args.term).eq("owner", user_id).eq("completed_at", undefined));
        }

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    }
})

export const activeTasksCount = queryWithAuth({
    args: {},
    handler: async (ctx) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;

        const tasks = await ctx.db.query("tasks").withIndex("by_owner_and_completed", (q) => q.eq("owner", user_id).eq("completed_at", undefined)).collect();

        return tasks.length;
    }
})

export const listOverdueTasks = queryWithAuth({
    args: { term: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;
        let query;

        if (args.term === "") {
            query = ctx.db.query("tasks").withIndex("by_owner_and_completed_and_due_date", (q) => q.eq("owner", user_id).eq("completed_at", undefined).lt("date_number", (new Date()).getTime()));
        } else {
            query = ctx.db.query("tasks").withSearchIndex("by_title", (q) => q.search("title", args.term).eq("owner", user_id).eq("completed_at", undefined));
        }

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    }
})

export const overdueTasksCount = queryWithAuth({
    args: {},
    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;

        const tasks = await ctx.db.query("tasks").withIndex("by_owner_and_completed_and_due_date", (q) => q.eq("owner", user_id).eq("completed_at", undefined).lt("date_number", (new Date()).getTime())).collect();

        return tasks.length;
    }
})

export const listCompletedTasks = queryWithAuth({
    args: { term: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;

        let query;

        if (args.term === "") {
            query = ctx.db.query("tasks").withIndex("by_owner", (q) => q.eq("owner", user_id)).filter((q) => q.neq(q.field("completed_at"), undefined));
        } else {
            query = ctx.db.query("tasks").withSearchIndex("by_title", (q) => q.search("title", args.term).eq("owner", user_id)).filter((q) => q.neq(q.field("completed_at"), undefined));
        }

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    }
})

export const completedTasksCount = queryWithAuth({
    args: {},
    handler: async (ctx) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;

        const tasks = await ctx.db.query("tasks").withIndex("by_owner", (q) => q.eq("owner", user_id)).filter((q) => q.neq(q.field("completed_at"), undefined)).collect();

        return tasks.length;
    }
})

export const addEmbedding = internalMutation({
    args: { taskId: v.id("tasks"), embedding: v.array(v.number()) },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.taskId, { embedding: args.embedding });
    }
})

export const populateEmbedding = internalAction({
    args: { taskId: v.id("tasks"), taskName: v.string(), taskDescription: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const openai = new OpenAI();
        const { data } = await openai.embeddings.create({
            input: [`${args.taskName}${args.taskDescription}`],
            model: "text-embedding-ada-002",
        });
        await ctx.runMutation(internal.tasks.addEmbedding, { taskId: args.taskId, embedding: data[0].embedding });
    },
})