import { getPrismaClient } from "@/lib/db/prisma";

export const WorkflowRunScope = {
  FULL: "FULL",
  GROUP: "GROUP",
  SINGLE: "SINGLE",
} as const;

export const WorkflowRunStatus = {
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  PARTIAL: "PARTIAL",
} as const;

export type WorkflowRunScope = (typeof WorkflowRunScope)[keyof typeof WorkflowRunScope];
export type WorkflowRunStatus = (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus];

export type ExecutionMetadata = {
  nodeId?: string;
  nodeType: string;
  nodeTitle?: string;
  scope?: WorkflowRunScope;
  summary?: string;
};

type JsonRecord = Record<string, unknown>;
type CreatedRunRecord = {
  id: string;
  nodeRuns: Array<{ id: string }>;
};
type WorkflowNodeSeed = {
  nodeId?: string;
  nodeType: string;
  nodeTitle?: string;
  inputs: JsonRecord;
  sequence: number;
};

type CreatedWorkflowRunRecord = {
  id: string;
  nodeRuns: Array<{ id: string; nodeId: string | null; sequence: number }>;
};

export async function beginSingleNodeRun(params: {
  userId: string;
  metadata: ExecutionMetadata;
  inputs: JsonRecord;
}) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;

  const scope = params.metadata.scope ?? WorkflowRunScope.SINGLE;
  const run = (await prisma.workflowRun.create({
    data: {
      userId: params.userId,
      scope,
      status: WorkflowRunStatus.RUNNING,
      summary: params.metadata.summary ?? params.metadata.nodeTitle ?? params.metadata.nodeType,
      nodeRuns: {
        create: {
          nodeId: params.metadata.nodeId,
          nodeType: params.metadata.nodeType,
          nodeTitle: params.metadata.nodeTitle,
          status: WorkflowRunStatus.RUNNING,
          inputs: params.inputs,
          sequence: 0,
        },
      },
    },
    include: {
      nodeRuns: true,
    },
  })) as CreatedRunRecord;

  return {
    workflowRunId: run.id,
    nodeRunId: run.nodeRuns[0]?.id,
  };
}

export async function finishSingleNodeRun(params: {
  workflowRunId: string;
  nodeRunId?: string;
  status: WorkflowRunStatus;
  outputs?: JsonRecord | null;
  error?: string | null;
  triggerRunId?: string | null;
  startedAt: number;
}) {
  const prisma = await getPrismaClient();
  if (!prisma) return;

  const finishedAt = new Date();
  const durationMs = Math.max(0, Date.now() - params.startedAt);

  await prisma.$transaction(async (tx) => {
    await tx.workflowRun.update({
      where: { id: params.workflowRunId },
      data: {
        status: params.status,
        finishedAt,
        durationMs,
      },
    });

    if (params.nodeRunId) {
      await tx.nodeRun.update({
        where: { id: params.nodeRunId },
        data: {
          status: params.status,
          outputs: params.outputs ?? undefined,
          error: params.error ?? undefined,
          triggerRunId: params.triggerRunId ?? undefined,
          finishedAt,
          durationMs,
        },
      });
    }
  });
}

export async function listWorkflowRuns(userId: string, take = 25) {
  const prisma = await getPrismaClient();
  if (!prisma) return [];

  return prisma.workflowRun.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take,
    include: {
      nodeRuns: {
        orderBy: { sequence: "asc" },
      },
    },
  });
}

export async function beginWorkflowRun(params: {
  userId: string;
  scope: WorkflowRunScope;
  summary: string;
  nodes: WorkflowNodeSeed[];
}) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;

  const run = (await prisma.workflowRun.create({
    data: {
      userId: params.userId,
      scope: params.scope,
      status: WorkflowRunStatus.RUNNING,
      summary: params.summary,
      nodeRuns: {
        create: params.nodes.map((node) => ({
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          nodeTitle: node.nodeTitle,
          status: WorkflowRunStatus.RUNNING,
          inputs: node.inputs,
          sequence: node.sequence,
        })),
      },
    },
    include: {
      nodeRuns: true,
    },
  })) as CreatedWorkflowRunRecord;

  return {
    workflowRunId: run.id,
    nodeRunIds: Object.fromEntries(
      run.nodeRuns.map((nodeRun) => [nodeRun.nodeId ?? `sequence-${nodeRun.sequence}`, nodeRun.id]),
    ) as Record<string, string>,
  };
}

export async function updateWorkflowNodeRun(params: {
  nodeRunId?: string;
  status: WorkflowRunStatus;
  outputs?: JsonRecord | null;
  error?: string | null;
  triggerRunId?: string | null;
  startedAt: number;
}) {
  const prisma = await getPrismaClient();
  if (!prisma || !params.nodeRunId) return;

  const finishedAt = new Date();
  const durationMs = Math.max(0, Date.now() - params.startedAt);

  await prisma.nodeRun.update({
    where: { id: params.nodeRunId },
    data: {
      status: params.status,
      outputs: params.outputs ?? undefined,
      error: params.error ?? undefined,
      triggerRunId: params.triggerRunId ?? undefined,
      finishedAt,
      durationMs,
    },
  });
}

export async function finishWorkflowRun(params: {
  workflowRunId?: string;
  startedAt: number;
  nodeStatuses: WorkflowRunStatus[];
}) {
  const prisma = await getPrismaClient();
  if (!prisma || !params.workflowRunId) return;

  const finishedAt = new Date();
  const durationMs = Math.max(0, Date.now() - params.startedAt);
  const hasSuccess = params.nodeStatuses.some((status) => status === WorkflowRunStatus.SUCCESS);
  const hasFailure = params.nodeStatuses.some((status) => status === WorkflowRunStatus.FAILED);

  let status: WorkflowRunStatus = WorkflowRunStatus.SUCCESS;
  if (hasFailure && hasSuccess) {
    status = WorkflowRunStatus.PARTIAL;
  } else if (hasFailure) {
    status = WorkflowRunStatus.FAILED;
  }

  await prisma.workflowRun.update({
    where: { id: params.workflowRunId },
    data: {
      status,
      finishedAt,
      durationMs,
    },
  });
}
