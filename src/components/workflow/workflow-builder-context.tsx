"use client";

import { createContext, useContext } from "react";

export type WorkflowNodeKind =
  | "text"
  | "imageUpload"
  | "videoUpload"
  | "llm"
  | "crop"
  | "extractFrame";

export type WorkflowAddRequest = {
  id: number;
  kind: WorkflowNodeKind;
};

type WorkflowBuilderContextValue = {
  addNode: (kind: WorkflowNodeKind) => void;
  request: WorkflowAddRequest | null;
  historyVersion: number;
  refreshHistory: () => void;
};

const WorkflowBuilderContext = createContext<WorkflowBuilderContextValue>({
  addNode: () => undefined,
  request: null,
  historyVersion: 0,
  refreshHistory: () => undefined,
});

/**
 * Shares quick-add requests and workflow-history refresh state across the workspace UI.
 */
export function WorkflowBuilderProvider({
  value,
  children,
}: {
  value: WorkflowBuilderContextValue;
  children: React.ReactNode;
}) {
  return (
    <WorkflowBuilderContext.Provider value={value}>
      {children}
    </WorkflowBuilderContext.Provider>
  );
}

/**
 * Returns the workflow builder context used by the sidebar, canvas, and history panel.
 */
export function useWorkflowBuilder() {
  return useContext(WorkflowBuilderContext);
}
