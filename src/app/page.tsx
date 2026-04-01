import { AppShell } from "@/components/sidebars/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";

export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-[#212121] text-white">
      <AppShell>
        <section className="h-full p-5 sm:p-6 lg:p-8">
          <WorkflowCanvas />
        </section>
      </AppShell>
    </main>
  );
}
