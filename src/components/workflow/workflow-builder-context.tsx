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
};

const WorkflowBuilderContext = createContext<WorkflowBuilderContextValue>({
  addNode: () => undefined,
  request: null,
});

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

export function useWorkflowBuilder() {
  return useContext(WorkflowBuilderContext);
}
