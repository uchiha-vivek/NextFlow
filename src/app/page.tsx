import { Show, SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/app");
  }

  return (
    <main
      className="relative flex min-h-[calc(100vh-73px)] flex-col lg:flex-row"
      style={{ backgroundImage: "var(--page-bg)" }}
    >
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <section className="flex flex-1 items-center justify-center border-b border-[color:var(--border-soft)] px-8 py-14 lg:border-b-0 lg:border-r">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            NextFlow Workspace Builder
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
            Build AI workflows with uploads, media tools, and connected LLM nodes.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-soft)]">
            Sign in to open the editor, wire nodes together, run Trigger.dev tasks,
            and iterate on image, video, and LLM pipelines in one place.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-5">
              <div className="text-sm font-medium text-[var(--text-primary)]">Media-first workflows</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                Upload with Transloadit, crop with FFmpeg, extract frames, and pass results downstream.
              </div>
            </div>
            <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-5">
              <div className="text-sm font-medium text-[var(--text-primary)]">Connected AI nodes</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                Route text and image handles into your LLM nodes and execute them through Trigger.dev.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-8 py-14">
        <Show when="signed-out">
          <div className="landing-auth-panel w-full max-w-md">
            <SignIn
              routing="hash"
              oauthFlow="popup"
              forceRedirectUrl="/app"
              signUpForceRedirectUrl="/app"
            />
          </div>
        </Show>
      </section>
    </main>
  );
}
