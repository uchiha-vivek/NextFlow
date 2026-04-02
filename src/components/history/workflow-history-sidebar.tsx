"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useWorkflowBuilder } from "@/components/workflow/workflow-builder-context";

type HistoryNodeRun = {
  id: string;
  nodeId: string | null;
  nodeType: string;
  nodeTitle: string | null;
  status: string;
  inputs: unknown;
  outputs: unknown;
  error: string | null;
  startedAt: string | Date;
  finishedAt: string | Date | null;
  durationMs: number | null;
  triggerRunId: string | null;
  sequence: number;
};

type WorkflowRunWithNodes = {
  id: string;
  userId: string;
  scope: string;
  status: string;
  summary: string | null;
  startedAt: string | Date;
  finishedAt: string | Date | null;
  durationMs: number | null;
  nodeRuns: HistoryNodeRun[];
};

function formatDuration(durationMs: number | null) {
  if (!durationMs) return "0s";
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 0 : 1)}s`;
}

function formatTimestamp(value: string | Date) {
  return new Date(value).toLocaleString();
}

function statusClasses(status: string) {
  if (status === "SUCCESS") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (status === "FAILED") return "bg-red-500/15 text-red-300 border-red-500/20";
  if (status === "PARTIAL") return "bg-amber-500/15 text-amber-200 border-amber-500/20";
  return "bg-yellow-500/15 text-yellow-200 border-yellow-500/20";
}

function scopeLabel(scope: string) {
  if (scope === "FULL") return "Full workflow";
  if (scope === "GROUP") return "Selected nodes";
  return "Single node";
}

function summarizeOutput(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const output = (value as { output?: unknown }).output;
  if (typeof output === "string") {
    return output.length > 88 ? `${output.slice(0, 85)}...` : output;
  }

  return null;
}

export function WorkflowHistorySidebar() {
  const { historyVersion } = useWorkflowBuilder();
  const [runs, setRuns] = useState<WorkflowRunWithNodes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/workflows/history", { cache: "no-store" });
        const result = (await response.json()) as { runs?: WorkflowRunWithNodes[] };

        if (!active) return;
        setRuns(result.runs ?? []);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    void load();

    return () => {
      active = false;
    };
  }, [historyVersion]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-zinc-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading workflow history...
        </div>
      );
    }

    if (runs.length === 0) {
      return (
        <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-5 text-sm leading-6 text-zinc-400">
          No workflow runs yet. Single node executions will appear here first, and the panel is ready for full or selected-group runs too.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {runs.map((run) => {
          const expanded = expandedId === run.id;

          return (
            <div
              key={run.id}
              className="rounded-2xl border border-white/8 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === run.id ? null : run.id))}
                className="flex w-full items-start gap-3 px-4 py-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusClasses(run.status)}`}
                    >
                      {run.status}
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                      {scopeLabel(run.scope)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">
                    Run {runs.length - runs.findIndex((item) => item.id === run.id)} · {formatTimestamp(run.startedAt)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {scopeLabel(run.scope)}{run.summary ? ` · ${run.summary}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>{formatTimestamp(run.startedAt)}</span>
                    <span>Duration: {formatDuration(run.durationMs)}</span>
                    <span>{run.nodeRuns.length} node{run.nodeRuns.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <ChevronDown
                  className={`mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>

              {expanded ? (
                <div className="border-t border-white/8 px-4 py-4">
                  <div className="space-y-4">
                    {run.nodeRuns.map((nodeRun) => (
                      <div key={nodeRun.id} className="relative pl-5">
                        <div className="absolute left-[7px] top-2 h-[calc(100%+10px)] w-px bg-white/10 last:hidden" />
                        <div className="absolute left-0 top-2 h-4 w-4 rounded-full border border-white/12 bg-[#131417]" />
                        <div className="absolute left-4 top-4 h-px w-3 bg-white/10" />

                        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-medium text-white">
                              {nodeRun.nodeTitle ?? nodeRun.nodeType}
                              {nodeRun.nodeId ? ` (${nodeRun.nodeId})` : ""}
                            </div>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusClasses(nodeRun.status)}`}
                            >
                              {nodeRun.status}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {formatDuration(nodeRun.durationMs)}
                            </span>
                          </div>

                          {summarizeOutput(nodeRun.outputs) ? (
                            <div className="mt-3 border-l border-white/10 pl-3 text-xs text-zinc-300">
                              Output: &quot;{summarizeOutput(nodeRun.outputs)}&quot;
                            </div>
                          ) : null}

                          {nodeRun.error ? (
                            <div className="mt-3 border-l border-red-500/20 pl-3 text-xs text-red-200">
                              Error: &quot;{nodeRun.error}&quot;
                            </div>
                          ) : null}

                          <details className="mt-3 rounded-lg border border-white/6 bg-black/20 px-3 py-2">
                            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              Node details
                            </summary>
                            <div className="mt-3 grid gap-3">
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                                  Inputs
                                </div>
                                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/6 bg-black/30 p-3 text-xs text-zinc-300">
                                  {JSON.stringify(nodeRun.inputs, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                                  Outputs
                                </div>
                                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/6 bg-black/30 p-3 text-xs text-zinc-300">
                                  {JSON.stringify(
                                    nodeRun.outputs ?? { error: nodeRun.error ?? null },
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            </div>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }, [expandedId, loading, runs]);

  return (
    <aside className="h-full border-l border-white/[0.04] bg-[#171717] px-4 py-5">
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Workflow History
          </div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
            Recent runs
          </div>
          <div className="mt-1 text-sm leading-6 text-zinc-400">
            Tracks single node runs now, and is structured for full workflow and selected-group runs.
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{content}</div>
      </div>
    </aside>
  );
}
