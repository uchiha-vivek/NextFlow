export type WorkflowNodeKind =
  | "text"
  | "imageUpload"
  | "videoUpload"
  | "llm"
  | "crop"
  | "extractFrame";

export type WorkflowRuntimeStatus = "idle" | "running" | "success" | "failed";

export type WorkflowNodeData = {
  title: string;
  accent: string;
  kind: WorkflowNodeKind;
  runtimeStatus?: WorkflowRuntimeStatus;
  runtimeMessage?: string | null;
  fileName?: string;
  previewUrl?: string | null;
  outputUrl?: string | null;
  textValue?: string;
  outputText?: string | null;
  model?: string;
  systemPrompt?: string;
  userMessage?: string;
  imageUrlInput?: string;
  videoUrlInput?: string;
  xPercent?: string;
  yPercent?: string;
  widthPercent?: string;
  heightPercent?: string;
  timestampInput?: string;
};

export type WorkflowCanvasNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
};

export type WorkflowCanvasEdge = {
  id: string;
  source: string;
  target: string;
  targetHandle?: string | null;
};

export type WorkflowExportPayload = {
  version: 1;
  exportedAt: string;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
};

export type StreamNodeResult = {
  nodeId: string;
  nodeType: string;
  nodeTitle: string;
  status: string;
  durationMs: number;
  outputs?: Record<string, unknown>;
  error?: string;
};

export function normalizeImportedNode(node: WorkflowCanvasNode): WorkflowCanvasNode {
  return {
    ...node,
    data: {
      ...node.data,
      runtimeStatus: "idle",
      runtimeMessage: null,
    },
  };
}

export function applyNodeExecutionResult(
  node: WorkflowCanvasNode,
  runResult: StreamNodeResult,
): WorkflowCanvasNode {
  const nextData: WorkflowNodeData = {
    ...node.data,
    runtimeStatus: runResult.status === "SUCCESS" ? "success" : "failed",
    runtimeMessage:
      runResult.status === "SUCCESS"
        ? `Completed in ${runResult.durationMs}ms`
        : runResult.error ?? "Node execution failed",
  };
  const output = runResult.outputs?.output;

  if (node.type === "llm" && typeof output === "string") {
    nextData.outputText = output;
  }

  if ((node.type === "crop" || node.type === "extractFrame") && typeof output === "string") {
    nextData.outputUrl = output;
  }

  return {
    ...node,
    data: nextData,
  };
}
