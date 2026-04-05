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

export type TextOutputLookup = Pick<Map<string, string>, "get">;
export type UrlOutputLookup = Pick<Map<string, string>, "get">;

export type ResolvedLlmInputs = {
  systemPrompt: string;
  userMessage: string;
  imageUrls: string[];
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

export function resolveConnectedMediaInput(
  nodeId: string,
  edges: WorkflowEdgeSnapshot[],
  outputUrlMap: UrlOutputLookup,
  fallbackValue: string,
) {
  const sourceId = getInboundSources(nodeId, edges)[0];
  return (sourceId ? outputUrlMap.get(sourceId) : null) ?? fallbackValue;
}

export function resolveLlmInputs(
  nodeId: string,
  edges: WorkflowEdgeSnapshot[],
  outputTextMap: TextOutputLookup,
  outputUrlMap: UrlOutputLookup,
  defaults: {
    systemPrompt: string;
    userMessage: string;
  },
): ResolvedLlmInputs {
  const systemSourceId = getInboundSources(nodeId, edges, "system")[0];
  const userSourceId = getInboundSources(nodeId, edges, "user")[0];
  const imageSourceIds = getInboundSources(nodeId, edges, "images");

  return {
    systemPrompt: (systemSourceId ? outputTextMap.get(systemSourceId) : null) ?? defaults.systemPrompt,
    userMessage: (userSourceId ? outputTextMap.get(userSourceId) : null) ?? defaults.userMessage,
    imageUrls: imageSourceIds
      .map((sourceId) => outputUrlMap.get(sourceId))
      .filter(isPublicHttpUrl),
  };
}
