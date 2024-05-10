"use node";

import { internalAction } from "./_generated/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendEmailsToUsers = internalAction({
    args: {},
    handler: async (ctx) => {
        resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'jordan@convex.dev',
            subject: 'Hello World',
            html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
        });
    }
})