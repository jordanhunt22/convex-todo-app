import { defineTable } from "convex/server";
import { v } from "convex/values";
import { queryWithAuth, mutationWithAuth } from "@convex-dev/convex-lucia-auth";

export const table = {
    tasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        due_date: v.string(),
        completed_at: v.optional(v.number()),
        owner: v.id("users"),
    }).index("by_owner_and_completed", ["owner", "completed_at"]).index("by_owner", ["owner"]).searchIndex("by_title", {
        searchField: "title", filterFields: ["owner", "completed_at"]
    })
}

export const addTask = mutationWithAuth({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        due_date: v.string(),
        completed_at: v.optional(v.number()),
    },

    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const task = await ctx.db.insert("tasks", { title: args.title, description: args.description, due_date: args.due_date, completed_at: args.completed_at, owner: ctx.session?.user._id });

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

        const task = await ctx.db.get(args.id);

        if (task && task.owner === ctx.session.user.userId) {
            await ctx.db.delete(task._id);
        }
    }
})

export const listActiveTasks = queryWithAuth({
    args: { term: v.string() },
    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;

        if (args.term === "") {
            return await ctx.db.query("tasks").withIndex("by_owner_and_completed", (q) => q.eq("owner", user_id).eq("completed_at", undefined)).collect();
        } else {
            return await ctx.db.query("tasks").withSearchIndex("by_title", (q) => q.search("title", args.term).eq("owner", user_id).eq("completed_at", undefined)).collect();
        }
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

export const listCompletedTasks = queryWithAuth({
    args: { term: v.string() },
    handler: async (ctx, args) => {
        if (!ctx.session?.user._id) {
            return null;
        }

        const user_id = ctx.session?.user._id;

        if (args.term === "") {
            return await ctx.db.query("tasks").withIndex("by_owner", (q) => q.eq("owner", user_id)).filter((q) => q.neq(q.field("completed_at"), undefined)).collect();
        } else {
            return await ctx.db.query("tasks").withSearchIndex("by_title", (q) => q.search("title", args.term).eq("owner", user_id)).filter((q) => q.neq(q.field("completed_at"), undefined)).collect();
        }
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