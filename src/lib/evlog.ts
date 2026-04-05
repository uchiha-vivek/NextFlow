import { createEvlog } from "evlog/next";
import { createInstrumentation } from "evlog/next/instrumentation";

const evlogOptions = {
  service: "nextflow",
  include: ["/api/**"],
  pretty: process.env.NODE_ENV !== "production",
  silent: false,
  enrich: ({ event }) => {
    const enrichedEvent = event as Record<string, unknown> & {
      app?: Record<string, string>;
    };

    enrichedEvent.app = {
      name: "nextflow",
      runtime: "nextjs",
    };

    if (process.env.VERCEL_ENV) {
      enrichedEvent.app.environment = process.env.VERCEL_ENV;
    }
  },
} satisfies Parameters<typeof createEvlog>[0];

export const { withEvlog, useLogger, log, createError, createEvlogError } =
  createEvlog(evlogOptions);

export const { register, onRequestError } = createInstrumentation(evlogOptions);
