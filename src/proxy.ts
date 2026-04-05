import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { evlogMiddleware } from "evlog/next";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/app(.*)",
  "/home(.*)",
  "/api/workflows(.*)",
  "/api/uploads(.*)",
]);

const applyEvlog = evlogMiddleware({
  include: ["/api/**"],
});

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return (await applyEvlog(req)) as unknown as Response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
