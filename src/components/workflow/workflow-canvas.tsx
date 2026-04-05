"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Handle,
  MiniMap,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodeConnections,
  useNodesData,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import type { Connection, Edge, Node, NodeProps } from "@xyflow/react";
import {
  CheckCircle2,
  LoaderCircle,
  Crop,
  ChevronRight,
  Download,
  FileUp,
  Hand,
  Info,
  FileImage,
  FileText,
  Maximize2,
  Minus,
  MousePointer2,
  AlertTriangle,
  PanelsTopLeft,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTheme } from "@/components/theme/theme-provider";
import {
  applyNodeExecutionResult,
  normalizeImportedNode,
  type StreamNodeResult,
  type WorkflowExportPayload,
} from "@/lib/workflow-canvas-utils";
import { useWorkflowBuilder, type WorkflowNodeKind } from "./workflow-builder-context";

type BaseWorkflowData = {
  title: string;
  accent: string;
  kind: WorkflowNodeKind;
  runtimeStatus?: "idle" | "running" | "success" | "failed";
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

type WorkflowNodeType = Node<BaseWorkflowData>;

type WorkflowNodeRuntimeStatus = NonNullable<BaseWorkflowData["runtimeStatus"]>;

type WorkflowExecutionStreamEvent =
  | {
      type: "workflow-start";
      workflowRunId: string | null;
      scope: "FULL" | "GROUP";
      nodeIds: string[];
      levelCount: number;
    }
  | {
      type: "level-start";
      levelIndex: number;
      nodeIds: string[];
    }
  | {
      type: "node-complete";
      result: StreamNodeResult;
    }
  | {
      type: "workflow-complete";
      workflowRunId: string | null;
      results: StreamNodeResult[];
    }
  | {
      type: "workflow-error";
      error: string;
    };

/**
 * Shared visual frame for workflow nodes, including connection handles and delete affordance.
 */
function NodeShell({
  children,
  accent,
  title,
  icon: Icon,
  outputLabel,
  input = true,
  nodeId,
  runtimeStatus = "idle",
  runtimeMessage = null,
}: {
  children: React.ReactNode;
  accent: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  outputLabel: string;
  input?: boolean;
  nodeId: string;
  runtimeStatus?: WorkflowNodeRuntimeStatus;
  runtimeMessage?: string | null;
}) {
  const reactFlow = useReactFlow<WorkflowNodeType, Edge>();
  const statusClasses =
    runtimeStatus === "running"
      ? "border-[#7fb0ff] shadow-[0_0_0_1px_rgba(127,176,255,0.55),0_0_32px_rgba(78,125,255,0.28),var(--shadow-elevated)] animate-[pulse_1.6s_ease-in-out_infinite]"
      : runtimeStatus === "success"
        ? "border-emerald-400/55 shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_0_24px_rgba(52,211,153,0.18),var(--shadow-elevated)]"
        : runtimeStatus === "failed"
          ? "border-red-400/55 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_0_24px_rgba(248,113,113,0.15),var(--shadow-elevated)]"
          : "border-[color:var(--border-soft)] shadow-[var(--shadow-elevated)]";

  const statusIcon =
    runtimeStatus === "running" ? (
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" strokeWidth={2.2} />
    ) : runtimeStatus === "success" ? (
      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
    ) : runtimeStatus === "failed" ? (
      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
    ) : (
      <Info className="h-3.5 w-3.5" strokeWidth={2.2} />
    );

  const statusLabel =
    runtimeStatus === "running"
      ? "Running"
      : runtimeStatus === "success"
        ? "Done"
        : runtimeStatus === "failed"
          ? "Failed"
          : "Ready";

  return (
    <div className={`min-w-[280px] select-none rounded-[22px] border bg-[var(--surface-1)] p-4 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 ${statusClasses}`}>
      {input ? (
        <Handle
          type="target"
          id="input"
          position={Position.Left}
          className="!h-4 !w-4 !border-2 !border-[#0f1012] !bg-[#7fb0ff] !shadow-[0_0_0_4px_rgba(78,125,255,0.18)]"
        />
      ) : null}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}
          >
            <Icon className="h-5 w-5 text-white" strokeWidth={2.1} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              {title}
            </div>
            <div
              className={[
                "mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                runtimeStatus === "running"
                  ? "border-[#7fb0ff]/30 bg-[#7fb0ff]/10 text-[#b8d1ff]"
                  : runtimeStatus === "success"
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                    : runtimeStatus === "failed"
                      ? "border-red-400/25 bg-red-400/10 text-red-200"
                      : "border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-muted)]",
              ].join(" ")}
            >
              {statusIcon}
              {statusLabel}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            reactFlow.setNodes((current) => current.filter((node) => node.id !== nodeId));
            reactFlow.setEdges((current) =>
              current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
            );
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-input)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
          aria-label="Delete node"
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.1} />
        </button>
      </div>
      {runtimeMessage ? (
        <div
          className={[
            "mb-4 rounded-xl border px-3 py-2 text-[12px]",
            runtimeStatus === "failed"
              ? "border-red-500/25 bg-red-500/10 text-red-200"
              : runtimeStatus === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                : runtimeStatus === "running"
                  ? "border-[#7fb0ff]/20 bg-[#7fb0ff]/10 text-[#dce9ff]"
                  : "border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-soft)]",
          ].join(" ")}
        >
          {runtimeMessage}
        </div>
      ) : null}
      <div className="space-y-3">{children}</div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {outputLabel}
        </div>
        <Handle
          type="source"
          id="output"
          position={Position.Right}
          className="!static !h-4 !w-4 !translate-x-0 !border-2 !border-[#0f1012] !bg-[#7fb0ff] !shadow-[0_0_0_4px_rgba(78,125,255,0.18)]"
        />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
      {children}
    </div>
  );
}

function FieldHandle({ id }: { id: string }) {
  return (
    <Handle
      id={id}
      type="target"
      position={Position.Left}
      className="!left-[-22px] !top-1/2 !h-4 !w-4 !-translate-y-1/2 !border-2 !border-[#0f1012] !bg-[#7fb0ff] !shadow-[0_0_0_4px_rgba(78,125,255,0.18)]"
    />
  );
}

/**
 * Converts lightweight markdown-ish model output into readable paragraphs and bullet lists.
 */
function renderFormattedText(value: string) {
  const lines = value.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;

    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      elements.push(
        <p key={`p-${elements.length}`} className="leading-6 text-zinc-100">
          {cleanInlineMarkdown(text)}
        </p>,
      );
    }

    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;

    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-2 pl-5 text-zinc-200">
        {listBuffer.map((item, index) => (
          <li key={`${elements.length}-${index}`} className="list-disc leading-6 marker:text-[#7fb0ff]">
            {cleanInlineMarkdown(item)}
          </li>
        ))}
      </ul>,
    );

    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      flushParagraph();
      listBuffer.push(line.replace(/^[-*•]\s+/, ""));
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return elements;
}

/**
 * Strips a few inline markdown markers so plain text renders cleanly inside node previews.
 */
function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

const inputClassName =
  "w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-input)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[#4e7dff]";

const actionButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-xl bg-[#4e7dff] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#618cff] disabled:cursor-not-allowed disabled:bg-[#2b3c72] disabled:text-zinc-300";

/**
 * Provides a focused setter for the current node's data without exposing the full React Flow state.
 */
function useWorkflowNodeData(id: string) {
  const reactFlow = useReactFlow<WorkflowNodeType, Edge>();

  const updateNodeData = useCallback(
    (patch: Partial<BaseWorkflowData>) => {
      reactFlow.setNodes((current) =>
        current.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch,
                },
              }
            : node,
        ),
      );
    },
    [id, reactFlow],
  );

  return { updateNodeData };
}

function TextNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const { updateNodeData } = useWorkflowNodeData(id);
  const value = data.textValue ?? "Describe the scene you want to generate...";

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={FileText}
      outputLabel="Text output"
      input={false}
      nodeId={id}
      runtimeStatus={data.runtimeStatus}
      runtimeMessage={data.runtimeMessage}
    >
      <div>
        <FieldLabel>Textarea</FieldLabel>
        <textarea
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            updateNodeData({
              textValue: nextValue,
              outputText: nextValue,
            });
          }}
          className={`${inputClassName} mt-2 min-h-[110px] resize-none`}
        />
      </div>
    </NodeShell>
  );
}

function ImageUploadNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const { updateNodeData } = useWorkflowNodeData(id);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = data.previewUrl ?? null;
  const fileName = data.fileName ?? "No image selected";
  const outputUrl = data.outputUrl ?? null;

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={FileImage}
      outputLabel="Image URL"
      nodeId={id}
      runtimeStatus={data.runtimeStatus}
      runtimeMessage={data.runtimeMessage}
    >
      <div>
        <FieldLabel>Transloadit upload</FieldLabel>
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/12 bg-black/20 px-3 py-5 text-center text-[13px] text-zinc-300 transition-colors hover:border-white/20">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const previewUrl = URL.createObjectURL(file);
              updateNodeData({
                fileName: file.name,
                previewUrl,
                outputUrl: previewUrl,
              });
              setIsUploading(true);
              setError(null);

              try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/uploads/image", {
                  method: "POST",
                  body: formData,
                });

                const result = (await response.json()) as {
                  error?: string;
                  outputUrl?: string;
                  fileName?: string;
                };

                if (!response.ok || !result.outputUrl) {
                  throw new Error(result.error ?? "Image upload failed");
                }

                updateNodeData({
                  fileName: result.fileName ?? file.name,
                  previewUrl: result.outputUrl,
                  outputUrl: result.outputUrl,
                });
              } catch (uploadError) {
                setError(
                  uploadError instanceof Error ? uploadError.message : "Image upload failed",
                );
              } finally {
                setIsUploading(false);
              }
            }}
          />
          {isUploading ? "Uploading..." : "Upload image"}
        </label>
      </div>
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <div className="text-[12px] text-zinc-400">{fileName}</div>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Uploaded preview"
            className="mt-3 h-32 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="mt-3 flex h-32 items-center justify-center rounded-lg bg-white/[0.03] text-[13px] text-zinc-600">
            Preview after upload
          </div>
        )}
        <div className="mt-3 text-[12px] text-zinc-500">
          {outputUrl?.startsWith("http")
            ? "Transloadit URL ready for downstream nodes."
            : "Select a file to upload it to Transloadit."}
        </div>
        {outputUrl ? (
          <div className="mt-2 break-all text-[12px] text-zinc-400">{outputUrl}</div>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </NodeShell>
  );
}

function VideoUploadNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const { updateNodeData } = useWorkflowNodeData(id);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = data.previewUrl ?? null;
  const fileName = data.fileName ?? "No video selected";
  const outputUrl = data.outputUrl ?? null;

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={Video}
      outputLabel="Video URL"
      nodeId={id}
      runtimeStatus={data.runtimeStatus}
      runtimeMessage={data.runtimeMessage}
    >
      <div>
        <FieldLabel>Transloadit upload</FieldLabel>
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/12 bg-black/20 px-3 py-5 text-center text-[13px] text-zinc-300 transition-colors hover:border-white/20">
          <input
            type="file"
            accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm,x-m4v"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const previewUrl = URL.createObjectURL(file);
              updateNodeData({
                fileName: file.name,
                previewUrl,
                outputUrl: previewUrl,
              });
              setIsUploading(true);
              setError(null);

              try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/uploads/video", {
                  method: "POST",
                  body: formData,
                });

                const result = (await response.json()) as {
                  error?: string;
                  outputUrl?: string;
                  fileName?: string;
                };

                if (!response.ok || !result.outputUrl) {
                  throw new Error(result.error ?? "Video upload failed");
                }

                updateNodeData({
                  fileName: result.fileName ?? file.name,
                  previewUrl: result.outputUrl,
                  outputUrl: result.outputUrl,
                });
              } catch (uploadError) {
                setError(
                  uploadError instanceof Error ? uploadError.message : "Video upload failed",
                );
              } finally {
                setIsUploading(false);
              }
            }}
          />
          {isUploading ? "Uploading..." : "Upload video"}
        </label>
      </div>
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <div className="text-[12px] text-zinc-400">{fileName}</div>
        {preview ? (
          <video
            src={preview}
            controls
            className="mt-3 h-36 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="mt-3 flex h-36 items-center justify-center rounded-lg bg-white/[0.03] text-[13px] text-zinc-600">
            Video preview after upload
          </div>
        )}
        <div className="mt-3 text-[12px] text-zinc-500">
          {outputUrl?.startsWith("http")
            ? "Transloadit URL ready for downstream nodes."
            : "Select a file to upload it to Transloadit."}
        </div>
        {outputUrl ? (
          <div className="mt-2 break-all text-[12px] text-zinc-400">{outputUrl}</div>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </NodeShell>
  );
}

function LlmNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const { updateNodeData } = useWorkflowNodeData(id);
  const { refreshHistory } = useWorkflowBuilder();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const systemConnections = useNodeConnections({ handleType: "target", handleId: "system" });
  const userConnections = useNodeConnections({ handleType: "target", handleId: "user" });
  const imageConnections = useNodeConnections({ handleType: "target", handleId: "images" });
  const connectedSourceIds = [
    ...new Set(
      [...systemConnections, ...userConnections, ...imageConnections].map(
        (connection) => connection.source,
      ),
    ),
  ];
  const connectedNodes = useNodesData<WorkflowNodeType>(connectedSourceIds);
  const model = data.model ?? "gpt-5.4-mini";
  const manualSystemPrompt =
    data.systemPrompt ?? "You are a creative workflow planner.";
  const manualUserMessage =
    data.userMessage ?? "Turn the uploaded input into a polished campaign-ready result.";
  const connectedSystemPrompt =
    connectedNodes.find((node) => systemConnections.some((connection) => connection.source === node.id))
      ?.data.outputText ?? null;
  const connectedUserMessage =
    connectedNodes.find((node) => userConnections.some((connection) => connection.source === node.id))
      ?.data.outputText ?? null;
  const connectedImageUrls = connectedNodes
    .filter((node) => imageConnections.some((connection) => connection.source === node.id))
    .map((node) => node.data.outputUrl)
    .filter((url): url is string => Boolean(url && url.startsWith("http")));
  const effectiveSystemPrompt = connectedSystemPrompt ?? manualSystemPrompt;
  const effectiveUserMessage = connectedUserMessage ?? manualUserMessage;
  const outputText = data.outputText ?? null;

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={Sparkles}
      outputLabel="LLM output"
      input={false}
      nodeId={id}
      runtimeStatus={data.runtimeStatus}
      runtimeMessage={data.runtimeMessage}
    >
      <div>
        <FieldLabel>Model</FieldLabel>
        <select
          value={model}
          onChange={(event) =>
            updateNodeData({
              model: event.target.value,
            })
          }
          className={`${inputClassName} mt-2`}
        >
          <option value="gpt-5.4-mini">gpt-5.4-mini</option>
          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
        </select>
      </div>
      <div className="relative">
        <FieldHandle id="system" />
        <FieldLabel>System prompt</FieldLabel>
        <textarea
          value={effectiveSystemPrompt}
          onChange={(event) =>
            updateNodeData({
              systemPrompt: event.target.value,
            })
          }
          className={`${inputClassName} mt-2 min-h-[80px] resize-none`}
          disabled={Boolean(connectedSystemPrompt)}
        />
        {connectedSystemPrompt ? (
          <div className="mt-2 text-[12px] text-emerald-300">
            Connected from text node output.
          </div>
        ) : null}
      </div>
      <div className="relative">
        <FieldHandle id="user" />
        <FieldLabel>User message</FieldLabel>
        <textarea
          value={effectiveUserMessage}
          onChange={(event) =>
            updateNodeData({
              userMessage: event.target.value,
            })
          }
          className={`${inputClassName} mt-2 min-h-[96px] resize-none`}
          disabled={Boolean(connectedUserMessage)}
        />
        {connectedUserMessage ? (
          <div className="mt-2 text-[12px] text-emerald-300">
            Connected from text node output.
          </div>
        ) : null}
      </div>
      <div className="relative">
        <FieldHandle id="images" />
        <FieldLabel>Images input</FieldLabel>
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-zinc-300">
          {connectedImageUrls.length} connected image(s)
        </div>
        {connectedImageUrls.length > 0 ? (
          <div className="space-y-2">
            {connectedImageUrls.map((url) => (
              <div key={url} className="break-all text-[12px] text-emerald-300">
                {url}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[12px] text-zinc-500">
            Connect one or more upload/crop/frame nodes here.
          </div>
        )}
        <div className="mt-2 text-[12px] text-zinc-500">
          Executes via Trigger.dev task
        </div>
      </div>
      <button
        type="button"
        disabled={isRunning}
        onClick={async () => {
          setIsRunning(true);
          setError(null);

          try {
            const response = await fetch("/api/workflows/run-llm", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
                body: JSON.stringify({
                  nodeId: id,
                  nodeTitle: data.title,
                  model,
                  systemPrompt: effectiveSystemPrompt,
                  userMessage: effectiveUserMessage,
                  imageUrls: connectedImageUrls,
                }),
            });

            const result = (await response.json()) as {
              error?: string;
              output?: string;
            };

            if (!response.ok || !result.output) {
            throw new Error(result.error ?? "LLM task failed");
          }

            updateNodeData({
              outputText: result.output,
            });
          } catch (runError) {
            setError(runError instanceof Error ? runError.message : "LLM task failed");
          } finally {
            refreshHistory();
            setIsRunning(false);
          }
        }}
        className={actionButtonClassName}
      >
        {isRunning ? "Running..." : "Run LLM"}
      </button>
      {isRunning ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[22px] bg-black/45 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#13151a]/95 px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#7fb0ff]" strokeWidth={2.2} />
            <div className="text-[12px] font-medium tracking-[0.08em] text-zinc-200">
              RUNNING LLM
            </div>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      ) : null}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <FieldLabel>Output</FieldLabel>
        {outputText ? (
          <div className="mt-3 space-y-3 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {renderFormattedText(outputText)}
          </div>
        ) : (
          <div className="mt-2 text-[12px] text-zinc-500">
            Azure OpenAI output will appear here after the Trigger.dev task finishes.
          </div>
        )}
      </div>
    </NodeShell>
  );
}

function CropNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const { updateNodeData } = useWorkflowNodeData(id);
  const { refreshHistory } = useWorkflowBuilder();
  const incomingConnections = useNodeConnections({ handleType: "target", handleId: "input" });
  const sourceIds = incomingConnections.map((connection) => connection.source);
  const connectedNodes = useNodesData<WorkflowNodeType>(sourceIds);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrl = data.imageUrlInput ?? "";
  const xPercent = data.xPercent ?? "0";
  const yPercent = data.yPercent ?? "0";
  const widthPercent = data.widthPercent ?? "100";
  const heightPercent = data.heightPercent ?? "100";
  const outputUrl = data.outputUrl ?? null;
  const connectedImageUrl =
    connectedNodes.find((node) => node.data.kind === "imageUpload")?.data.outputUrl ?? null;
  const effectiveImageUrl = connectedImageUrl ?? imageUrl;
  const usesLocalBlobImage = effectiveImageUrl.startsWith("blob:");

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={Crop}
      outputLabel="output"
      nodeId={id}
      runtimeStatus={data.runtimeStatus}
      runtimeMessage={data.runtimeMessage}
    >
      <div>
        <FieldLabel>image_url</FieldLabel>
        <input
          value={effectiveImageUrl}
          onChange={(event) =>
            updateNodeData({
              imageUrlInput: event.target.value,
            })
          }
          className={`${inputClassName} mt-2`}
          placeholder="Required image URL (jpg, jpeg, png, webp, gif)"
          disabled={Boolean(connectedImageUrl)}
        />
        {connectedImageUrl ? (
          <div className="mt-2 text-[12px] text-emerald-300">
            Connected from upload node output.
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "x_percent", value: xPercent, key: "xPercent" as const },
          { label: "y_percent", value: yPercent, key: "yPercent" as const },
          { label: "width_percent", value: widthPercent, key: "widthPercent" as const },
          { label: "height_percent", value: heightPercent, key: "heightPercent" as const },
        ].map(({ label, value, key }) => (
          <div key={label}>
            <FieldLabel>{label}</FieldLabel>
            <input
              value={value}
              onChange={(event) =>
                updateNodeData({
                  [key]: event.target.value,
                })
              }
              className={`${inputClassName} mt-2`}
            />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-[12px] leading-5 text-zinc-400">
        <div>Provider: Internal (FFmpeg via Trigger.dev task)</div>
        <div>Output: Cropped image URL (uploaded via Transloadit)</div>
      </div>
      <button
        type="button"
        disabled={isRunning}
        onClick={async () => {
          if (usesLocalBlobImage) {
            setError(
              "This image is still only a local browser preview (blob URL). Upload Image -> Crop will fully work after the upload node is wired to Transloadit and returns a public URL.",
            );
            return;
          }

          setIsRunning(true);
          setError(null);

          try {
            const response = await fetch("/api/workflows/crop-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
                body: JSON.stringify({
                  nodeId: id,
                  nodeTitle: data.title,
                  image_url: effectiveImageUrl,
                  x_percent: xPercent,
                  y_percent: yPercent,
                width_percent: widthPercent,
                height_percent: heightPercent,
              }),
            });

            const result = (await response.json()) as {
              error?: string;
              output?: string;
            };

            if (!response.ok || !result.output) {
              throw new Error(result.error ?? "Crop task failed");
            }

            updateNodeData({
              outputUrl: result.output,
            });
          } catch (runError) {
            setError(runError instanceof Error ? runError.message : "Crop task failed");
          } finally {
            refreshHistory();
            setIsRunning(false);
          }
        }}
        className={actionButtonClassName}
      >
        {isRunning ? "Running..." : "Run crop"}
      </button>
      {usesLocalBlobImage ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
          Connected image is a local `blob:` URL. Trigger.dev can only process public URLs.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      ) : null}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <FieldLabel>output</FieldLabel>
        {outputUrl ? (
          <>
            <div className="mt-2 break-all text-[12px] text-zinc-300">{outputUrl}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outputUrl}
              alt="Cropped output"
              className="mt-3 h-32 w-full rounded-lg object-cover"
            />
          </>
        ) : (
          <div className="mt-2 text-[12px] text-zinc-500">
            Cropped image URL will appear here after the Trigger.dev task finishes.
          </div>
        )}
      </div>
    </NodeShell>
  );
}

function ExtractFrameNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const { updateNodeData } = useWorkflowNodeData(id);
  const { refreshHistory } = useWorkflowBuilder();
  const incomingConnections = useNodeConnections({ handleType: "target", handleId: "input" });
  const sourceIds = incomingConnections.map((connection) => connection.source);
  const connectedNodes = useNodesData<WorkflowNodeType>(sourceIds);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoUrl = data.videoUrlInput ?? "";
  const timestamp = data.timestampInput ?? "0";
  const outputUrl = data.outputUrl ?? null;
  const connectedVideoUrl =
    connectedNodes.find((node) => node.data.kind === "videoUpload")?.data.outputUrl ?? null;
  const effectiveVideoUrl = connectedVideoUrl ?? videoUrl;
  const usesLocalBlobVideo = effectiveVideoUrl.startsWith("blob:");

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={PanelsTopLeft}
      outputLabel="output"
      nodeId={id}
      runtimeStatus={data.runtimeStatus}
      runtimeMessage={data.runtimeMessage}
    >
      <div>
        <FieldLabel>video_url</FieldLabel>
        <input
          value={effectiveVideoUrl}
          onChange={(event) =>
            updateNodeData({
              videoUrlInput: event.target.value,
            })
          }
          className={`${inputClassName} mt-2`}
          placeholder="Required video URL (mp4, mov, webm, m4v)"
          disabled={Boolean(connectedVideoUrl)}
        />
        {connectedVideoUrl ? (
          <div className="mt-2 text-[12px] text-emerald-300">
            Connected from upload node output.
          </div>
        ) : null}
      </div>
      <div>
        <FieldLabel>timestamp</FieldLabel>
        <input
          value={timestamp}
          onChange={(event) =>
            updateNodeData({
              timestampInput: event.target.value,
            })
          }
          className={`${inputClassName} mt-2`}
          placeholder='Optional. Use seconds like "12.5" or percentage like "50%"'
        />
      </div>
      <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-[12px] leading-5 text-zinc-400">
        <div>Provider: Internal (FFmpeg via Trigger.dev task)</div>
        <div>Output: Extracted frame image URL (uploaded via Transloadit)</div>
      </div>
      <button
        type="button"
        disabled={isRunning}
        onClick={async () => {
          if (usesLocalBlobVideo) {
            setError(
              "This video is still only a local browser preview (blob URL). Upload Video -> Extract Frame will fully work after the upload node is wired to Transloadit and returns a public URL.",
            );
            return;
          }

          setIsRunning(true);
          setError(null);

          try {
            const response = await fetch("/api/workflows/extract-frame", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
                body: JSON.stringify({
                  nodeId: id,
                  nodeTitle: data.title,
                  video_url: effectiveVideoUrl,
                  timestamp,
                }),
            });

            const result = (await response.json()) as {
              error?: string;
              output?: string;
            };

            if (!response.ok || !result.output) {
              throw new Error(result.error ?? "Extract frame task failed");
            }

            updateNodeData({
              outputUrl: result.output,
            });
          } catch (runError) {
            setError(
              runError instanceof Error ? runError.message : "Extract frame task failed",
            );
          } finally {
            refreshHistory();
            setIsRunning(false);
          }
        }}
        className={actionButtonClassName}
      >
        {isRunning ? "Running..." : "Extract frame"}
      </button>
      {usesLocalBlobVideo ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
          Connected video is a local `blob:` URL. Trigger.dev can only process public URLs.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      ) : null}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3">
        <FieldLabel>output</FieldLabel>
        {outputUrl ? (
          <>
            <div className="mt-2 break-all text-[12px] text-zinc-300">{outputUrl}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outputUrl}
              alt="Extracted frame output"
              className="mt-3 h-32 w-full rounded-lg object-cover"
            />
          </>
        ) : (
          <div className="mt-2 text-[12px] text-zinc-500">
            Extracted frame image URL will appear here after the Trigger.dev task finishes.
          </div>
        )}
      </div>
    </NodeShell>
  );
}

const nodeTypes = {
  text: TextNode,
  imageUpload: ImageUploadNode,
  videoUpload: VideoUploadNode,
  llm: LlmNode,
  crop: CropNode,
  extractFrame: ExtractFrameNode,
};

const nodePresets: Record<
  WorkflowNodeKind,
  Pick<WorkflowNodeType, "type"> & { title: string; accent: string }
> = {
  text: {
    type: "text",
    title: "Text Node",
    accent: "bg-[linear-gradient(135deg,#1f67ff_0%,#5ea1ff_100%)]",
  },
  imageUpload: {
    type: "imageUpload",
    title: "Upload Image Node",
    accent: "bg-[linear-gradient(135deg,#08b66f_0%,#21e19a_100%)]",
  },
  videoUpload: {
    type: "videoUpload",
    title: "Upload Video Node",
    accent: "bg-[linear-gradient(135deg,#ffb000_0%,#ffd24d_100%)]",
  },
  llm: {
    type: "llm",
    title: "Run Any LLM Node",
    accent: "bg-[linear-gradient(135deg,#8a5cff_0%,#b78cff_100%)]",
  },
  crop: {
    type: "crop",
    title: "Crop Image Node",
    accent: "bg-[linear-gradient(135deg,#ff6b35_0%,#ff9768_100%)]",
  },
  extractFrame: {
    type: "extractFrame",
    title: "Extract Frame from Video",
    accent: "bg-[linear-gradient(135deg,#00b6ff_0%,#57dcff_100%)]",
  },
};

const initialNodes: WorkflowNodeType[] = [];

const initialEdges: Edge[] = [];

type StarterPreset = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  image: string;
};

const starterPresets: StarterPreset[] = [
  {
    id: "empty",
    title: "Empty Workflow",
    description: "Start from a blank workflow canvas.",
    image: "linear-gradient(135deg,#252525_0%,#171717_100%)",
  },
  {
    id: "image-generator",
    title: "Image Generator",
    description: "Simple text and image prompt generation.",
    image: "linear-gradient(135deg,#5677c8_0%,#1e2635_100%)",
  },
  {
    id: "video-generator",
    title: "Video Generator",
    description: "Generate video inputs with an upload-driven flow.",
    image: "linear-gradient(135deg,#2b384f_0%,#0f1118_100%)",
  },
  {
    id: "upscale-enhance",
    title: "8K Upscaling & Enhancer",
    description: "Upscaling a low resolution image to 8K.",
    image: "linear-gradient(135deg,#4d3d2b_0%,#171310_100%)",
  },
  {
    id: "image-caption",
    title: "LLM Image Captioning",
    description: "Generate a prompt from an image with GPT-5.",
    badge: "PRO",
    image: "linear-gradient(135deg,#3c4031_0%,#151710_100%)",
  },
  {
    id: "prompt-to-workflow",
    title: "Prompt to Workflow",
    description: "Generate a workflow from a prompt.",
    badge: "PRO",
    image: "linear-gradient(135deg,#3a2942_0%,#151018_100%)",
  },
];

const toolItems: Array<{
  kind: WorkflowNodeKind;
  category: "Image" | "Video" | "Text" | "AI";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  {
    kind: "text",
    category: "Text",
    label: "Text",
    description: "Prompt, notes, or instructions",
    icon: FileText,
  },
  {
    kind: "imageUpload",
    category: "Image",
    label: "Image",
    description: "Upload an image input",
    icon: FileImage,
  },
  {
    kind: "videoUpload",
    category: "Video",
    label: "Video",
    description: "Upload a video input",
    icon: Video,
  },
  {
    kind: "llm",
    category: "AI",
    label: "LLM",
    description: "Run GPT on text or images",
    icon: Sparkles,
  },
  {
    kind: "crop",
    category: "Image",
    label: "Crop",
    description: "Crop an image output",
    icon: Crop,
  },
  {
    kind: "extractFrame",
    category: "Video",
    label: "Extract",
    description: "Grab a frame from video",
    icon: PanelsTopLeft,
  },
];

function createWorkflowNode(
  kind: WorkflowNodeKind,
  id: string,
  position: { x: number; y: number },
  dataPatch: Partial<BaseWorkflowData> = {},
): WorkflowNodeType {
  return {
    id,
    type: nodePresets[kind].type,
    position,
    data: {
      title: nodePresets[kind].title,
      accent: nodePresets[kind].accent,
      kind,
      runtimeStatus: "idle",
      runtimeMessage: null,
      ...dataPatch,
    },
  };
}

function buildStarterTemplate(kind: StarterPreset["id"]): {
  nodes: WorkflowNodeType[];
  edges: Edge[];
} {
  const createEdge = (
    id: string,
    source: string,
    target: string,
    targetHandle?: string,
  ): Edge => ({
    id,
    source,
    target,
    targetHandle,
    type: "smoothstep",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#7fb0ff",
    },
    style: { stroke: "#7fb0ff", strokeWidth: 2.4, strokeDasharray: "6 6" },
  });

  if (kind === "image-generator") {
    return {
      nodes: [
        createWorkflowNode("text", "text-seed", { x: 70, y: 160 }, {
          textValue: "Describe a cinematic product image with dramatic lighting.",
          outputText: "Describe a cinematic product image with dramatic lighting.",
        }),
        createWorkflowNode("imageUpload", "image-upload-seed", { x: 430, y: 110 }),
        createWorkflowNode("llm", "llm-seed", { x: 450, y: 420 }, {
          userMessage: "Turn the uploaded image and prompt into a polished campaign concept.",
        }),
      ],
      edges: [
        createEdge("edge-text-llm", "text-seed", "llm-seed", "user"),
        createEdge("edge-image-llm", "image-upload-seed", "llm-seed", "images"),
      ],
    };
  }

  if (kind === "video-generator") {
    return {
      nodes: [
        createWorkflowNode("videoUpload", "video-upload-seed", { x: 70, y: 140 }),
        createWorkflowNode("extractFrame", "extract-frame-seed", { x: 430, y: 130 }, {
          timestampInput: "50%",
        }),
        createWorkflowNode("llm", "llm-seed", { x: 790, y: 180 }, {
          userMessage: "Describe this keyframe like a motion art director.",
        }),
      ],
      edges: [
        createEdge("edge-video-frame", "video-upload-seed", "extract-frame-seed"),
        createEdge("edge-frame-llm", "extract-frame-seed", "llm-seed", "images"),
      ],
    };
  }

  if (kind === "upscale-enhance") {
    return {
      nodes: [
        createWorkflowNode("imageUpload", "image-upload-enhance", { x: 80, y: 170 }),
        createWorkflowNode("crop", "crop-enhance", { x: 420, y: 170 }, {
          xPercent: "10",
          yPercent: "10",
          widthPercent: "80",
          heightPercent: "80",
        }),
      ],
      edges: [createEdge("edge-image-crop", "image-upload-enhance", "crop-enhance")],
    };
  }

  if (kind === "image-caption") {
    return {
      nodes: [
        createWorkflowNode("imageUpload", "image-upload-caption", { x: 80, y: 150 }),
        createWorkflowNode("text", "text-caption", { x: 80, y: 390 }, {
          textValue: "Caption this image with a concise creative summary.",
          outputText: "Caption this image with a concise creative summary.",
        }),
        createWorkflowNode("llm", "llm-caption", { x: 430, y: 220 }),
      ],
      edges: [
        createEdge("edge-caption-image", "image-upload-caption", "llm-caption", "images"),
        createEdge("edge-caption-text", "text-caption", "llm-caption", "user"),
      ],
    };
  }

  if (kind === "prompt-to-workflow") {
    return {
      nodes: [
        createWorkflowNode("text", "prompt-text", { x: 80, y: 180 }, {
          textValue: "Create a product marketing workflow for one image and one video.",
          outputText: "Create a product marketing workflow for one image and one video.",
        }),
        createWorkflowNode("llm", "prompt-llm", { x: 440, y: 180 }, {
          systemPrompt: "You are a workflow planner. Return a short structured workflow outline.",
        }),
      ],
      edges: [createEdge("edge-prompt-llm", "prompt-text", "prompt-llm", "user")],
    };
  }

  return { nodes: [], edges: [] };
}

function WorkflowCanvasInner() {
  const { request, refreshHistory } = useWorkflowBuilder();
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolAnchorPosition, setToolAnchorPosition] = useState<{ x: number; y: number } | null>(null);
  const [toolSearch, setToolSearch] = useState("");
  const reactFlow = useReactFlow();
  const handledRequestId = useRef<number | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const isLight = theme === "light";

  /**
   * Normalizes new edges so ad-hoc user connections always inherit the workflow canvas styling.
   */
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#7fb0ff",
            },
            style: { stroke: "#7fb0ff", strokeWidth: 2.4, strokeDasharray: "6 6" },
          },
          current,
        ),
      ),
    [setEdges],
  );

  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;

    handledRequestId.current = request.id;
    const preset = nodePresets[request.kind];
    const viewport = reactFlow.getViewport();
    const x = Math.round((-viewport.x + 360) / viewport.zoom);
    const y = Math.round((-viewport.y + 180) / viewport.zoom);

    setNodes((current) => [
      ...current,
      {
        id: `${request.kind}-${request.id}`,
        type: preset.type,
        position: { x, y },
        data: {
          title: preset.title,
          accent: preset.accent,
          kind: request.kind,
        },
      },
    ]);
  }, [reactFlow, request, setNodes]);

  useEffect(() => {
    const frame = canvasFrameRef.current;
    const pane = frame?.querySelector(".react-flow__pane") as HTMLElement | null;
    if (!pane) return;

    const handleDoubleClick: EventListener = (event) => {
      if (!(event instanceof MouseEvent)) return;

      const nextPosition = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setToolAnchorPosition(nextPosition);
      setToolsOpen(true);
    };

    pane.addEventListener("dblclick", handleDoubleClick);
    return () => pane.removeEventListener("dblclick", handleDoubleClick);
  }, [reactFlow]);

  /**
   * Keeps the minimap colors aligned with the semantic node type palette used in the main canvas.
   */
  const miniMapNodeColor = useCallback((node: WorkflowNodeType) => {
    const colorMap: Record<WorkflowNodeKind, string> = {
      text: "#5ea1ff",
      imageUpload: "#21e19a",
      videoUpload: "#ffd24d",
      llm: "#b78cff",
      crop: "#ff9768",
      extractFrame: "#57dcff",
    };

    return colorMap[node.data.kind];
  }, []);

  const emptyState = useMemo(
    () => nodes.length === 0,
    [nodes.length],
  );
  const selectedNodeCount = useMemo(
    () => nodes.filter((node) => node.selected).length,
    [nodes],
  );
  const filteredToolItems = useMemo(() => {
    const query = toolSearch.trim().toLowerCase();
    if (!query) return toolItems;

    return toolItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    );
  }, [toolSearch]);
  const groupedToolItems = useMemo(() => {
    const orderedCategories = ["Image", "Video", "Text", "AI"] as const;

    return orderedCategories
      .map((category) => ({
        category,
        items: filteredToolItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredToolItems]);

  const addNodeAtPosition = useCallback(
    (kind: WorkflowNodeKind, position?: { x: number; y: number }) => {
      const viewport = reactFlow.getViewport();
      const fallbackPosition = {
        x: Math.round((-viewport.x + 380) / viewport.zoom),
        y: Math.round((-viewport.y + 220) / viewport.zoom),
      };
      const nextPosition = position ?? toolAnchorPosition ?? fallbackPosition;
      const nextId = `${kind}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      setNodes((current) => [...current, createWorkflowNode(kind, nextId, nextPosition)]);
      setToolsOpen(false);
      setToolSearch("");
    },
    [reactFlow, setNodes, toolAnchorPosition],
  );

  const applyStarterPreset = useCallback(
    (presetId: StarterPreset["id"]) => {
      if (presetId === "empty") {
        setNodes([]);
        setEdges([]);
        return;
      }

      const template = buildStarterTemplate(presetId);
      setNodes(template.nodes);
      setEdges(template.edges);
      setToolSearch("");
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.2, duration: 260 });
      }, 30);
      setToolsOpen(false);
    },
    [reactFlow, setEdges, setNodes],
  );

  const clearNodeExecutionState = useCallback(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: {
          ...node.data,
          runtimeStatus: "idle",
          runtimeMessage: null,
        },
      })),
    );
  }, [setNodes]);

  const exportWorkflowAsJson = useCallback(() => {
    const payload: WorkflowExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nextflow-workflow-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [edges, nodes]);

  const importWorkflowFromFile = useCallback(
    async (file: File) => {
      const content = await file.text();
      const parsed = JSON.parse(content) as Partial<WorkflowExportPayload>;

      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error("Invalid workflow JSON. Expected nodes and edges arrays.");
      }

      const importedNodes = parsed.nodes.map(normalizeImportedNode);
      setNodes(importedNodes);
      setEdges(parsed.edges);
      setWorkflowError(null);

      setTimeout(() => {
        reactFlow.fitView({ padding: 0.18, duration: 260 });
      }, 30);
    },
    [reactFlow, setEdges, setNodes],
  );

  const runWorkflow = useCallback(
    async (scope: "FULL" | "GROUP") => {
      setIsWorkflowRunning(true);
      setWorkflowError(null);
      clearNodeExecutionState();

      try {
        const response = await fetch("/api/workflows/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/x-ndjson",
          },
          body: JSON.stringify({
            scope,
            nodes,
            edges,
          }),
        });

        if (!response.ok || !response.body) {
          const failure = (await response.json().catch(() => ({ error: undefined }))) as {
            error?: string;
          };
          throw new Error(failure.error ?? "Workflow execution failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalResults: StreamNodeResult[] = [];

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const event = JSON.parse(trimmed) as WorkflowExecutionStreamEvent;

            if (event.type === "workflow-start") {
              setNodes((current) =>
                current.map((node) =>
                  event.nodeIds.includes(node.id)
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          runtimeStatus: "idle",
                          runtimeMessage: "Queued for execution",
                        },
                      }
                    : node,
                ),
              );
            }

            if (event.type === "level-start") {
              setNodes((current) =>
                current.map((node) =>
                  event.nodeIds.includes(node.id)
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          runtimeStatus: "running",
                          runtimeMessage: "Running now...",
                        },
                      }
                    : node,
                ),
              );
            }

            if (event.type === "node-complete") {
              setNodes((current) =>
                current.map((node) =>
                  node.id === event.result.nodeId
                    ? applyNodeExecutionResult(node, event.result)
                    : node,
                ),
              );
            }

            if (event.type === "workflow-complete") {
              finalResults = event.results;
            }

            if (event.type === "workflow-error") {
              throw new Error(event.error);
            }
          }

          if (done) {
            if (buffer.trim()) {
              const event = JSON.parse(buffer.trim()) as WorkflowExecutionStreamEvent;
              if (event.type === "workflow-complete") {
                finalResults = event.results;
              } else if (event.type === "workflow-error") {
                throw new Error(event.error);
              }
            }
            break;
          }
        }

        if (finalResults.length === 0) {
          throw new Error("Workflow execution finished without results.");
        }

        refreshHistory();
      } catch (error) {
        setNodes((current) =>
          current.map((node) =>
            node.data.runtimeStatus === "running"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    runtimeStatus: "failed",
                    runtimeMessage:
                      error instanceof Error ? error.message : "Workflow execution failed",
                  },
                }
              : node,
          ),
        );
        setWorkflowError(
          error instanceof Error ? error.message : "Workflow execution failed",
        );
      } finally {
        setIsWorkflowRunning(false);
      }
    },
    [clearNodeExecutionState, edges, nodes, refreshHistory, setNodes],
  );

  return (
    <div
      ref={canvasFrameRef}
      className="relative h-full overflow-hidden rounded-[30px] border border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_20%),linear-gradient(180deg,#121212_0%,#0c0c0d_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.34)] select-none"
      style={{
        borderColor: "var(--border-soft)",
        backgroundImage: "var(--canvas-bg)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <div className="absolute left-5 top-5 z-10">
        <div className="inline-flex items-center gap-3 rounded-[18px] border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-3 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-primary)]">
            <PanelsTopLeft className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Untitled
          </div>
        </div>
      </div>

      <div className="absolute right-5 top-5 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={exportWorkflowAsJson}
            disabled={nodes.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 text-[13px] font-medium text-[var(--text-secondary)] shadow-[var(--shadow-panel)] backdrop-blur-xl transition-colors hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" strokeWidth={2.1} />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 text-[13px] font-medium text-[var(--text-secondary)] shadow-[var(--shadow-panel)] backdrop-blur-xl transition-colors hover:bg-[var(--surface-3)]"
          >
            <FileUp className="h-4 w-4" strokeWidth={2.1} />
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              try {
                await importWorkflowFromFile(file);
              } catch (error) {
                setWorkflowError(
                  error instanceof Error ? error.message : "Unable to import workflow JSON",
                );
              } finally {
                event.target.value = "";
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setToolsOpen((current) => !current)}
            className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-[13px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          >
            Tools
          </button>
          <button
            type="button"
            onClick={() => void runWorkflow("FULL")}
            disabled={isWorkflowRunning || nodes.length === 0}
            className="rounded-xl bg-[#4e7dff] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#618cff] disabled:cursor-not-allowed disabled:bg-[#2b3c72] disabled:text-zinc-300"
          >
            {isWorkflowRunning ? (
              <span className="inline-flex items-center justify-center">
                <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.4} />
              </span>
            ) : (
              "Run workflow"
            )}
          </button>
          <button
            type="button"
            onClick={() => void runWorkflow("GROUP")}
            disabled={isWorkflowRunning || selectedNodeCount === 0}
            className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-[13px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Run selected
          </button>
        </div>
        {workflowError ? (
          <div className="max-w-sm rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-right text-[12px] text-red-200">
            {workflowError}
          </div>
        ) : null}
        {selectedNodeCount > 0 ? (
          <div className="text-[12px] text-[var(--text-soft)]">
            {selectedNodeCount} node{selectedNodeCount === 1 ? "" : "s"} selected
          </div>
        ) : null}
      </div>

      <div
        className={[
          "absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity duration-200",
          toolsOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div
          className={[
            "w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] border border-[color:var(--border-soft)] bg-[var(--surface-1)] shadow-[var(--shadow-elevated)] backdrop-blur-2xl transition-all duration-200",
            toolsOpen ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.98]",
          ].join(" ")}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[color:var(--border-soft)] px-3 py-2.5">
            <div className="flex items-center gap-2.5 rounded-[16px] border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={2.1} />
              <input
                value={toolSearch}
                onChange={(event) => setToolSearch(event.target.value)}
                placeholder="Search nodes or models..."
                className="w-full bg-transparent text-[14px] tracking-[-0.03em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => {
                  setToolsOpen(false);
                  setToolSearch("");
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
                aria-label="Close tools"
                title="Close tools"
              >
                <X className="h-4 w-4" strokeWidth={2.1} />
              </button>
            </div>
          </div>

          <div className="sidebar-scrollbar max-h-[62vh] overflow-y-auto px-2.5 py-2.5">
            {groupedToolItems.length > 0 ? (
              groupedToolItems.map((group) => (
                <div key={group.category} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex items-center gap-2 px-2 text-[12px] tracking-[-0.02em] text-zinc-500">
                    <span className="flex h-4 w-4 items-center justify-center rounded-md bg-white/[0.06]">
                      {group.category === "Image" ? (
                        <FileImage className="h-3 w-3" strokeWidth={2.1} />
                      ) : group.category === "Video" ? (
                        <Video className="h-3 w-3" strokeWidth={2.1} />
                      ) : group.category === "Text" ? (
                        <FileText className="h-3 w-3" strokeWidth={2.1} />
                      ) : (
                        <Sparkles className="h-3 w-3" strokeWidth={2.1} />
                      )}
                    </span>
                    {group.category}
                  </div>

                  <div className="space-y-1">
                    {group.items.map(({ kind, label, description }) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => addNodeAtPosition(kind)}
                        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-white transition-colors hover:bg-white/[0.08]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-medium tracking-[-0.03em] text-white">
                            {label}
                          </div>
                          <div className="mt-0.5 text-[11px] leading-4 text-zinc-500">
                            {description}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2.2} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 py-8 text-center">
                <div className="text-[15px] font-medium tracking-[-0.03em] text-white">
                  No matching tools
                </div>
                <div className="mt-2 text-[13px] text-zinc-500">
                  Try searching for image, video, text, or llm.
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-white/[0.08] pt-4">
              <div className="mb-2 px-2 text-[12px] tracking-[-0.02em] text-zinc-500">
                Starter flows
              </div>
              <div className="space-y-1">
                {starterPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyStarterPreset(preset.id)}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]"
                  >
                    <div
                      className="h-9 w-9 shrink-0 rounded-xl border border-white/8"
                      style={{ background: preset.image }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium tracking-[-0.03em] text-white">
                        {preset.title}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                        {preset.description}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" strokeWidth={2.2} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {emptyState ? (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-[38px] font-semibold tracking-[-0.06em] text-white/88">
              Add a node
            </div>
            <div className="mt-3 text-[18px] tracking-[-0.03em] text-zinc-400">
              Double click anywhere on the canvas to open tools
            </div>
          </div>
        </div>
      ) : null}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitViewOptions={{ padding: 0.16, minZoom: 0.55 }}
        minZoom={0.35}
        maxZoom={1.8}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#7fb0ff",
          },
          style: { stroke: "#7fb0ff", strokeWidth: 2.4, strokeDasharray: "6 6" },
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "#7fb0ff", strokeWidth: 2.2, strokeDasharray: "6 6" }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        nodesDraggable
        nodesConnectable
        connectOnClick={false}
        elementsSelectable
        onPaneClick={() => setToolsOpen(false)}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.35}
          color={isLight ? "#d7d1c7" : "#24262d"}
        />
        <MiniMap
          pannable
          zoomable
          maskColor={isLight ? "rgba(245, 243, 239, 0.72)" : "rgba(7, 8, 10, 0.72)"}
          className="!bottom-5 !right-5 !rounded-2xl !border !shadow-[var(--shadow-panel)]"
          style={{
            borderColor: "var(--border-soft)",
            background: "var(--surface-1)",
          }}
          nodeColor={miniMapNodeColor}
        />
      </ReactFlow>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-[22px] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setToolsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          aria-label="Open tools"
          title="Open tools"
        >
          <Plus className="h-5 w-5" strokeWidth={2.3} />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-[var(--text-primary)]"
          aria-label="Select mode"
          title="Select mode"
        >
          <MousePointer2 className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          aria-label="Pan mode"
          title="Pan mode"
        >
          <Hand className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-soft)]" />
        <button
          type="button"
          onClick={() => reactFlow.zoomOut({ duration: 180 })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" strokeWidth={2.3} />
        </button>
        <button
          type="button"
          onClick={() => reactFlow.zoomIn({ duration: 180 })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" strokeWidth={2.3} />
        </button>
        <button
          type="button"
          onClick={() => reactFlow.fitView({ padding: 0.16, duration: 240 })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          aria-label="Fit view"
          title="Fit view"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2.1} />
        </button>
      </div>
    </div>
  );
}

/**
 * Wraps the workflow canvas in a React Flow provider so sidebar actions can add and run nodes.
 */
export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
