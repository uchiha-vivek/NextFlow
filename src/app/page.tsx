import { Show, SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/workspace");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col bg-[radial-gradient(circle_at_top,rgba(92,140,255,0.12),transparent_36%),linear-gradient(180deg,#121316_0%,#0b0c0e_100%)] lg:flex-row">
      <section className="flex flex-1 items-center justify-center border-b border-white/6 px-8 py-14 lg:border-b-0 lg:border-r">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            NextFlow Workspace Builder
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            Build AI workflows with uploads, media tools, and connected LLM nodes.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
            Sign in to open the editor, wire nodes together, run Trigger.dev tasks,
            and iterate on image, video, and LLM pipelines in one place.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-medium text-zinc-200">Media-first workflows</div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                Upload with Transloadit, crop with FFmpeg, extract frames, and pass results downstream.
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <div className="text-sm font-medium text-zinc-200">Connected AI nodes</div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
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
              forceRedirectUrl="/workspace"
              signUpForceRedirectUrl="/workspace"
            />
          </div>
        </Show>
      </section>
    </main>
  );
}
