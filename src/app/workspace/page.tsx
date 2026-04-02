"use client";

import { useState } from "react";
import { AppShell } from "@/components/sidebars/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import {
  WorkflowBuilderProvider,
  type WorkflowAddRequest,
  type WorkflowNodeKind,
} from "@/components/workflow/workflow-builder-context";

export default function WorkspacePage() {
  const [request, setRequest] = useState<WorkflowAddRequest | null>(null);

  const addNode = (kind: WorkflowNodeKind) => {
    setRequest({
      id: Date.now() + Math.floor(Math.random() * 1000),
      kind,
    });
  };

  return (
    <WorkflowBuilderProvider value={{ addNode, request }}>
      <main className="h-screen overflow-hidden bg-[#212121] text-white">
        <AppShell onQuickAddNode={addNode}>
          <section className="h-full p-5 sm:p-6 lg:p-8">
            <WorkflowCanvas />
          </section>
        </AppShell>
      </main>
    </WorkflowBuilderProvider>
  );
}
