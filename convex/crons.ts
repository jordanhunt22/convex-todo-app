import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";


const crons = cronJobs();

crons.daily(
    "Send daily summary",
    {
        hourUTC: 18,
        minuteUTC: 0,
    },
    internal.emails.sendEmailsToUsers
)

export default crons;