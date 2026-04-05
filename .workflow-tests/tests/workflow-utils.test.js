"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const workflow_canvas_utils_1 = require("../src/lib/workflow-canvas-utils");
const workflow_execution_utils_1 = require("../src/lib/workflow-execution-utils");
function createNode(id, type, overrides = {}) {
    return {
        id,
        type,
        position: { x: 0, y: 0 },
        data: {
            title: `${type}-${id}`,
            accent: "bg-test",
            kind: type === "imageUpload" || type === "videoUpload" || type === "llm" || type === "crop" || type === "extractFrame"
                ? type
                : "text",
            runtimeStatus: "running",
            runtimeMessage: "Old state",
            ...overrides,
        },
    };
}
(0, node_test_1.default)("getTopologicalLevels returns parallel-safe levels for a simple DAG", () => {
    const nodes = [
        { id: "text", type: "text", data: {} },
        { id: "image", type: "imageUpload", data: {} },
        { id: "llm", type: "llm", data: {} },
    ];
    const edges = [
        { source: "text", target: "llm", targetHandle: "user" },
        { source: "image", target: "llm", targetHandle: "images" },
    ];
    strict_1.default.deepEqual((0, workflow_execution_utils_1.getTopologicalLevels)(nodes, edges), [["text", "image"], ["llm"]]);
});
(0, node_test_1.default)("getTopologicalLevels falls back to remaining nodes when a cycle exists", () => {
    const nodes = [
        { id: "a", type: "text", data: {} },
        { id: "b", type: "llm", data: {} },
    ];
    const edges = [
        { source: "a", target: "b" },
        { source: "b", target: "a" },
    ];
    strict_1.default.deepEqual((0, workflow_execution_utils_1.getTopologicalLevels)(nodes, edges), [["a", "b"]]);
});
(0, node_test_1.default)("getInboundSources filters by target handle when provided", () => {
    const edges = [
        { source: "text", target: "llm", targetHandle: "user" },
        { source: "system", target: "llm", targetHandle: "system" },
        { source: "image", target: "llm", targetHandle: "images" },
    ];
    strict_1.default.deepEqual((0, workflow_execution_utils_1.getInboundSources)("llm", edges, "user"), ["text"]);
    strict_1.default.deepEqual((0, workflow_execution_utils_1.getInboundSources)("llm", edges), ["text", "system", "image"]);
});
(0, node_test_1.default)("scope summary and URL helper produce expected workflow-friendly values", () => {
    strict_1.default.equal((0, workflow_execution_utils_1.getScopeSummary)("FULL", 4), "Full workflow run");
    strict_1.default.equal((0, workflow_execution_utils_1.getScopeSummary)("GROUP", 1), "1 selected node run");
    strict_1.default.equal((0, workflow_execution_utils_1.getScopeSummary)("GROUP", 3), "3 selected nodes run");
    strict_1.default.equal((0, workflow_execution_utils_1.isPublicHttpUrl)("https://example.com/file.png"), true);
    strict_1.default.equal((0, workflow_execution_utils_1.isPublicHttpUrl)("http://example.com/file.png"), true);
    strict_1.default.equal((0, workflow_execution_utils_1.isPublicHttpUrl)("blob:abc"), false);
    strict_1.default.equal((0, workflow_execution_utils_1.isPublicHttpUrl)("/relative/path"), false);
});
(0, node_test_1.default)("normalizeImportedNode clears transient runtime state on imported workflows", () => {
    const imported = (0, workflow_canvas_utils_1.normalizeImportedNode)(createNode("llm-1", "llm", {
        runtimeStatus: "failed",
        runtimeMessage: "Task failed earlier",
        outputText: "Existing output",
    }));
    strict_1.default.equal(imported.data.runtimeStatus, "idle");
    strict_1.default.equal(imported.data.runtimeMessage, null);
    strict_1.default.equal(imported.data.outputText, "Existing output");
});
(0, node_test_1.default)("applyNodeExecutionResult stores LLM text output and success state", () => {
    const updated = (0, workflow_canvas_utils_1.applyNodeExecutionResult)(createNode("llm-1", "llm"), {
        nodeId: "llm-1",
        nodeType: "llm",
        nodeTitle: "LLM",
        status: "SUCCESS",
        durationMs: 321,
        outputs: { output: "Generated copy" },
    });
    strict_1.default.equal(updated.data.runtimeStatus, "success");
    strict_1.default.equal(updated.data.runtimeMessage, "Completed in 321ms");
    strict_1.default.equal(updated.data.outputText, "Generated copy");
});
(0, node_test_1.default)("applyNodeExecutionResult stores media URL output and failure state", () => {
    const updated = (0, workflow_canvas_utils_1.applyNodeExecutionResult)(createNode("crop-1", "crop"), {
        nodeId: "crop-1",
        nodeType: "crop",
        nodeTitle: "Crop",
        status: "FAILED",
        durationMs: 87,
        error: "Missing public image URL",
    });
    strict_1.default.equal(updated.data.runtimeStatus, "failed");
    strict_1.default.equal(updated.data.runtimeMessage, "Missing public image URL");
    strict_1.default.equal(updated.data.outputUrl, undefined);
});
(0, node_test_1.default)("applyNodeExecutionResult stores crop/extract output URLs when available", () => {
    const updated = (0, workflow_canvas_utils_1.applyNodeExecutionResult)(createNode("frame-1", "extractFrame"), {
        nodeId: "frame-1",
        nodeType: "extractFrame",
        nodeTitle: "Frame",
        status: "SUCCESS",
        durationMs: 455,
        outputs: { output: "https://cdn.example.com/frame.png" },
    });
    strict_1.default.equal(updated.data.runtimeStatus, "success");
    strict_1.default.equal(updated.data.outputUrl, "https://cdn.example.com/frame.png");
});
