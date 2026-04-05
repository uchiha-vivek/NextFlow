"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  EyeOff,
  PanelsTopLeft,
  Plus,
  Search,
} from "lucide-react";
import { WorkflowHistorySidebar } from "@/components/history/workflow-history-sidebar";
import { AppShell } from "@/components/sidebars/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import {
  WorkflowBuilderProvider,
  type WorkflowAddRequest,
  type WorkflowNodeKind,
} from "@/components/workflow/workflow-builder-context";

const nodeEditorTabs = ["Projects", "Apps", "Examples", "Templates"] as const;

function NodeEditorLanding({ onStart }: { onStart: () => void }) {
  const [activeTab, setActiveTab] = useState<(typeof nodeEditorTabs)[number]>("Projects");

  return (
    <section className="sidebar-scrollbar h-full overflow-y-auto p-5 sm:p-6 lg:p-8">
      <div className="overflow-hidden rounded-[30px] border border-white/[0.06] bg-[#171717] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <div className="relative min-h-[410px] overflow-hidden rounded-b-[28px] rounded-t-[30px] border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[url('/workflow1.avif')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_30%,rgba(255,255,255,0.18),transparent_18%),linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.28))]" />
          <div className="absolute -left-8 top-8 h-[420px] w-[290px] rotate-[-8deg] rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(240,240,238,0.62))] shadow-[0_30px_80px_rgba(0,0,0,0.16)] blur-[1px]" />
          <div className="relative z-10 flex min-h-[410px] items-center px-10 py-12 sm:px-14">
            <div className="max-w-[420px]">
              <div className="inline-flex items-center gap-3 rounded-[18px] bg-[#1d7ef8] px-4 py-3 shadow-[0_12px_30px_rgba(29,126,248,0.26)]">
                <PanelsTopLeft className="h-5 w-5 text-white" strokeWidth={2.2} />
                <span className="text-[17px] font-medium tracking-[-0.03em] text-white">
                  Node Editor
                </span>
              </div>
              <h1 className="mt-4 text-[54px] font-medium tracking-[-0.055em] text-white">
                Node Editor
              </h1>
              <p className="mt-3 text-[17px] font-medium leading-[1.6] tracking-[-0.02em] text-white/95">
                Nodes is the most powerful way to operate NextFlow. Connect every tool
                and model into complex automated pipelines.
              </p>
              <button
                type="button"
                onClick={onStart}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-[15px] font-medium tracking-[-0.03em] text-black shadow-[0_16px_35px_rgba(255,255,255,0.18)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                New Workflow
                <span className="text-[18px] leading-none">-&gt;</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,#1a1a1a_0%,#131313_100%)] px-8 py-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {nodeEditorTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "rounded-2xl px-5 py-3 text-[15px] font-medium transition-colors",
                    activeTab === tab
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                  ].join(" ")}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-zinc-400">
                <Search className="h-4 w-4" strokeWidth={2.1} />
                <span className="text-[15px]">Search projects...</span>
              </div>
              <button className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[15px] text-white">
                Last viewed
                <ChevronDown className="h-4 w-4 text-zinc-500" strokeWidth={2.1} />
              </button>
              <button className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:text-white">
                <EyeOff className="h-4 w-4" strokeWidth={2.1} />
              </button>
            </div>
          </div>

          <div className="mt-7 border-t border-white/[0.06] pt-7">
            <button
              type="button"
              onClick={onStart}
              className="group flex h-[176px] w-full max-w-[270px] flex-col items-center justify-center rounded-[28px] border border-white/8 bg-white/[0.03] transition-transform duration-300 hover:-translate-y-1 hover:bg-white/[0.05]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-[0_12px_24px_rgba(255,255,255,0.1)]">
                <Plus className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="mt-4 text-[16px] font-medium tracking-[-0.03em] text-white">
                New workflow
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [request, setRequest] = useState<WorkflowAddRequest | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const editorMode = useMemo(() => searchParams.get("editor") === "1", [searchParams]);
  const [workflowStarted, setWorkflowStarted] = useState(editorMode);

  useEffect(() => {
    setWorkflowStarted(editorMode);
  }, [editorMode]);

  const openEditor = () => {
    setWorkflowStarted(true);
    router.replace("/workspace?editor=1");
  };

  const addNode = (kind: WorkflowNodeKind) => {
    openEditor();
    setRequest({
      id: Date.now() + Math.floor(Math.random() * 1000),
      kind,
    });
  };

  const refreshHistory = () => {
    setHistoryVersion((current) => current + 1);
  };

  return (
    <WorkflowBuilderProvider value={{ addNode, request, historyVersion, refreshHistory }}>
      <main className="h-screen overflow-hidden bg-[#212121] text-white">
        <AppShell
          onQuickAddNode={addNode}
          rightSidebar={workflowStarted ? <WorkflowHistorySidebar /> : undefined}
        >
          {workflowStarted ? (
            <section className="h-full p-3 sm:p-4 lg:p-5">
              <WorkflowCanvas />
            </section>
          ) : (
            <NodeEditorLanding onStart={openEditor} />
          )}
        </AppShell>
      </main>
    </WorkflowBuilderProvider>
  );
}
