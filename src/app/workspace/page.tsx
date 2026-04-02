"use client";

import { useState } from "react";
import { WorkflowHistorySidebar } from "@/components/history/workflow-history-sidebar";
import { AppShell } from "@/components/sidebars/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import {
  WorkflowBuilderProvider,
  type WorkflowAddRequest,
  type WorkflowNodeKind,
} from "@/components/workflow/workflow-builder-context";

export default function WorkspacePage() {
  const [request, setRequest] = useState<WorkflowAddRequest | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const addNode = (kind: WorkflowNodeKind) => {
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
          rightSidebar={<WorkflowHistorySidebar />}
        >
          <section className="h-full p-5 sm:p-6 lg:p-8">
            <WorkflowCanvas />
          </section>
        </AppShell>
      </main>
    </WorkflowBuilderProvider>
  );
}
