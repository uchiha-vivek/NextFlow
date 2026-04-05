"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPublicHttpUrl = isPublicHttpUrl;
exports.getScopeSummary = getScopeSummary;
exports.getTopologicalLevels = getTopologicalLevels;
exports.getInboundSources = getInboundSources;
function isPublicHttpUrl(value) {
    return typeof value === "string" && /^https?:\/\//.test(value);
}
function getScopeSummary(scope, count) {
    return scope === "FULL"
        ? "Full workflow run"
        : `${count} selected node${count === 1 ? "" : "s"} run`;
}
function getTopologicalLevels(nodes, edges) {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const indegree = new Map();
    const adjacency = new Map();
    for (const node of nodes) {
        indegree.set(node.id, 0);
        adjacency.set(node.id, []);
    }
    for (const edge of edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target))
            continue;
        adjacency.get(edge.source)?.push(edge.target);
        indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    }
    const remaining = new Set(nodes.map((node) => node.id));
    const levels = [];
    while (remaining.size > 0) {
        const currentLevel = [...remaining].filter((nodeId) => (indegree.get(nodeId) ?? 0) === 0);
        if (currentLevel.length === 0) {
            levels.push([...remaining]);
            break;
        }
        levels.push(currentLevel);
        for (const nodeId of currentLevel) {
            remaining.delete(nodeId);
            for (const targetId of adjacency.get(nodeId) ?? []) {
                indegree.set(targetId, Math.max(0, (indegree.get(targetId) ?? 0) - 1));
            }
        }
    }
    return levels;
}
function getInboundSources(nodeId, edges, handleId) {
    return edges
        .filter((edge) => edge.target === nodeId && (handleId ? edge.targetHandle === handleId : true))
        .map((edge) => edge.source);
}
