import test from "node:test";
import assert from "node:assert/strict";
import {
  applyNodeExecutionResult,
  normalizeImportedNode,
  type WorkflowCanvasNode,
} from "../src/lib/workflow-canvas-utils";
import {
  getInboundSources,
  getScopeSummary,
  getTopologicalLevels,
  isPublicHttpUrl,
  type WorkflowEdgeSnapshot,
  type WorkflowNodeSnapshot,
} from "../src/lib/workflow-execution-utils";

function createNode(
  id: string,
  type: WorkflowCanvasNode["type"],
  overrides: Partial<WorkflowCanvasNode["data"]> = {},
): WorkflowCanvasNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      title: `${type}-${id}`,
      accent: "bg-test",
      kind:
        type === "imageUpload" || type === "videoUpload" || type === "llm" || type === "crop" || type === "extractFrame"
          ? type
          : "text",
      runtimeStatus: "running",
      runtimeMessage: "Old state",
      ...overrides,
    },
  };
}

test("getTopologicalLevels returns parallel-safe levels for a simple DAG", () => {
  const nodes: WorkflowNodeSnapshot[] = [
    { id: "text", type: "text", data: {} },
    { id: "image", type: "imageUpload", data: {} },
    { id: "llm", type: "llm", data: {} },
  ];
  const edges: WorkflowEdgeSnapshot[] = [
    { source: "text", target: "llm", targetHandle: "user" },
    { source: "image", target: "llm", targetHandle: "images" },
  ];

  assert.deepEqual(getTopologicalLevels(nodes, edges), [["text", "image"], ["llm"]]);
});

test("getTopologicalLevels falls back to remaining nodes when a cycle exists", () => {
  const nodes: WorkflowNodeSnapshot[] = [
    { id: "a", type: "text", data: {} },
    { id: "b", type: "llm", data: {} },
  ];
  const edges: WorkflowEdgeSnapshot[] = [
    { source: "a", target: "b" },
    { source: "b", target: "a" },
  ];

  assert.deepEqual(getTopologicalLevels(nodes, edges), [["a", "b"]]);
});

test("getInboundSources filters by target handle when provided", () => {
  const edges: WorkflowEdgeSnapshot[] = [
    { source: "text", target: "llm", targetHandle: "user" },
    { source: "system", target: "llm", targetHandle: "system" },
    { source: "image", target: "llm", targetHandle: "images" },
  ];

  assert.deepEqual(getInboundSources("llm", edges, "user"), ["text"]);
  assert.deepEqual(getInboundSources("llm", edges), ["text", "system", "image"]);
});

test("scope summary and URL helper produce expected workflow-friendly values", () => {
  assert.equal(getScopeSummary("FULL", 4), "Full workflow run");
  assert.equal(getScopeSummary("GROUP", 1), "1 selected node run");
  assert.equal(getScopeSummary("GROUP", 3), "3 selected nodes run");

  assert.equal(isPublicHttpUrl("https://example.com/file.png"), true);
  assert.equal(isPublicHttpUrl("http://example.com/file.png"), true);
  assert.equal(isPublicHttpUrl("blob:abc"), false);
  assert.equal(isPublicHttpUrl("/relative/path"), false);
});

test("normalizeImportedNode clears transient runtime state on imported workflows", () => {
  const imported = normalizeImportedNode(
    createNode("llm-1", "llm", {
      runtimeStatus: "failed",
      runtimeMessage: "Task failed earlier",
      outputText: "Existing output",
    }),
  );

  assert.equal(imported.data.runtimeStatus, "idle");
  assert.equal(imported.data.runtimeMessage, null);
  assert.equal(imported.data.outputText, "Existing output");
});

test("applyNodeExecutionResult stores LLM text output and success state", () => {
  const updated = applyNodeExecutionResult(
    createNode("llm-1", "llm"),
    {
      nodeId: "llm-1",
      nodeType: "llm",
      nodeTitle: "LLM",
      status: "SUCCESS",
      durationMs: 321,
      outputs: { output: "Generated copy" },
    },
  );

  assert.equal(updated.data.runtimeStatus, "success");
  assert.equal(updated.data.runtimeMessage, "Completed in 321ms");
  assert.equal(updated.data.outputText, "Generated copy");
});

test("applyNodeExecutionResult stores media URL output and failure state", () => {
  const updated = applyNodeExecutionResult(
    createNode("crop-1", "crop"),
    {
      nodeId: "crop-1",
      nodeType: "crop",
      nodeTitle: "Crop",
      status: "FAILED",
      durationMs: 87,
      error: "Missing public image URL",
    },
  );

  assert.equal(updated.data.runtimeStatus, "failed");
  assert.equal(updated.data.runtimeMessage, "Missing public image URL");
  assert.equal(updated.data.outputUrl, undefined);
});

test("applyNodeExecutionResult stores crop/extract output URLs when available", () => {
  const updated = applyNodeExecutionResult(
    createNode("frame-1", "extractFrame"),
    {
      nodeId: "frame-1",
      nodeType: "extractFrame",
      nodeTitle: "Frame",
      status: "SUCCESS",
      durationMs: 455,
      outputs: { output: "https://cdn.example.com/frame.png" },
    },
  );

  assert.equal(updated.data.runtimeStatus, "success");
  assert.equal(updated.data.outputUrl, "https://cdn.example.com/frame.png");
});
