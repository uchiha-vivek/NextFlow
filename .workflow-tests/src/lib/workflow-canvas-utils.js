"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeImportedNode = normalizeImportedNode;
exports.applyNodeExecutionResult = applyNodeExecutionResult;
function normalizeImportedNode(node) {
    return {
        ...node,
        data: {
            ...node.data,
            runtimeStatus: "idle",
            runtimeMessage: null,
        },
    };
}
function applyNodeExecutionResult(node, runResult) {
    const nextData = {
        ...node.data,
        runtimeStatus: runResult.status === "SUCCESS" ? "success" : "failed",
        runtimeMessage: runResult.status === "SUCCESS"
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
