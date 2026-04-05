export type WorkflowNodeSnapshot = {
  id: string;
  type: string;
  selected?: boolean;
  data: Record<string, unknown>;
};

export type WorkflowEdgeSnapshot = {
  source: string;
  target: string;
  targetHandle?: string | null;
};

export function isPublicHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

export function getScopeSummary(scope: "FULL" | "GROUP", count: number) {
  return scope === "FULL"
    ? "Full workflow run"
    : `${count} selected node${count === 1 ? "" : "s"} run`;
}

export function getTopologicalLevels(
  nodes: WorkflowNodeSnapshot[],
  edges: WorkflowEdgeSnapshot[],
) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const remaining = new Set(nodes.map((node) => node.id));
  const levels: string[][] = [];

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

export function getInboundSources(
  nodeId: string,
  edges: WorkflowEdgeSnapshot[],
  handleId?: string,
) {
  return edges
    .filter((edge) => edge.target === nodeId && (handleId ? edge.targetHandle === handleId : true))
    .map((edge) => edge.source);
}
