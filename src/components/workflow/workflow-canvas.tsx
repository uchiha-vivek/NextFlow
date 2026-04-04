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
  LoaderCircle,
  Crop,
  FileImage,
  FileText,
  Maximize2,
  Minus,
  PanelsTopLeft,
  Plus,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useWorkflowBuilder,
  type WorkflowNodeKind,
} from "./workflow-builder-context";

type BaseWorkflowData = {
  title: string;
  accent: string;
  kind: WorkflowNodeKind;
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
}: {
  children: React.ReactNode;
  accent: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  outputLabel: string;
  input?: boolean;
  nodeId: string;
}) {
  const reactFlow = useReactFlow<WorkflowNodeType, Edge>();

  return (
    <div className="min-w-[280px] select-none rounded-[22px] border border-white/10 bg-[#111215]/95 p-4 shadow-[0_22px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl">
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
          <div className="truncate text-[15px] font-semibold tracking-[-0.03em] text-white">
            {title}
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 transition-colors hover:border-white/20 hover:bg-black/30 hover:text-white"
          aria-label="Delete node"
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.1} />
        </button>
      </div>
      <div className="space-y-3">{children}</div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
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
    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
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
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#4e7dff]";

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

const initialNodes: WorkflowNodeType[] = [
  {
    id: "text-1",
    type: "text",
    position: { x: 70, y: 120 },
    data: {
      title: "Text Node",
      accent: nodePresets.text.accent,
      kind: "text",
    },
  },
  {
    id: "imageUpload-1",
    type: "imageUpload",
    position: { x: 430, y: 80 },
    data: {
      title: "Upload Image Node",
      accent: nodePresets.imageUpload.accent,
      kind: "imageUpload",
    },
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 430, y: 420 },
    data: {
      title: "Run Any LLM Node",
      accent: nodePresets.llm.accent,
      kind: "llm",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "text-llm",
    source: "text-1",
    target: "llm-1",
    targetHandle: "user",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
  {
    id: "image-llm",
    source: "imageUpload-1",
    target: "llm-1",
    targetHandle: "images",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
];

function WorkflowCanvasInner() {
  const { request, refreshHistory } = useWorkflowBuilder();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const reactFlow = useReactFlow();
  const handledRequestId = useRef<number | null>(null);

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

  const runWorkflow = useCallback(
    async (scope: "FULL" | "GROUP") => {
      setIsWorkflowRunning(true);
      setWorkflowError(null);

      try {
        const response = await fetch("/api/workflows/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scope,
            nodes,
            edges,
          }),
        });

        const result = (await response.json()) as {
          error?: string;
          results?: Array<{
            nodeId: string;
            nodeType: string;
            status: string;
            outputs?: Record<string, unknown>;
          }>;
        };

        if (!response.ok || !result.results) {
          throw new Error(result.error ?? "Workflow execution failed");
        }

        setNodes((current) =>
          current.map((node) => {
            const runResult = result.results?.find((item) => item.nodeId === node.id);
            if (!runResult?.outputs) return node;

            const nextData = { ...node.data };
            const output = runResult.outputs.output;

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
          }),
        );

        refreshHistory();
      } catch (error) {
        setWorkflowError(
          error instanceof Error ? error.message : "Workflow execution failed",
        );
      } finally {
        setIsWorkflowRunning(false);
      }
    },
    [edges, nodes, refreshHistory, setNodes],
  );

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(78,125,255,0.12),transparent_28%),linear-gradient(180deg,#171717_0%,#101010_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.34)] select-none">
      {emptyState ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-black/35 px-6 py-5 text-center backdrop-blur-xl">
          <div className="text-[18px] font-semibold tracking-[-0.03em] text-white">
            Add nodes from Quick Access
          </div>
          <div className="mt-2 text-[13px] text-zinc-400">
            Text, image, video, LLM, crop, and extract-frame nodes are ready.
          </div>
        </div>
      ) : null}

      <div className="absolute right-5 top-5 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0f1013]/90 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => void runWorkflow("FULL")}
            disabled={isWorkflowRunning || nodes.length === 0}
            className="rounded-xl bg-[#4e7dff] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#618cff] disabled:cursor-not-allowed disabled:bg-[#2b3c72] disabled:text-zinc-300"
          >
            {isWorkflowRunning ? "Running..." : "Run workflow"}
          </button>
          <button
            type="button"
            onClick={() => void runWorkflow("GROUP")}
            disabled={isWorkflowRunning || selectedNodeCount === 0}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] font-semibold text-zinc-100 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:border-white/6 disabled:text-zinc-500"
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
          <div className="text-[12px] text-zinc-400">
            {selectedNodeCount} node{selectedNodeCount === 1 ? "" : "s"} selected
          </div>
        ) : null}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
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
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="#2f3441"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(7, 8, 10, 0.72)"
          className="!bottom-5 !right-5 !rounded-2xl !border !border-white/10 !bg-[#0e0f12]/90 !shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          nodeColor={miniMapNodeColor}
        />
      </ReactFlow>

      <div className="absolute bottom-5 left-5 z-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f12]/90 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => reactFlow.zoomIn({ duration: 180 })}
          className="flex h-8 w-8 items-center justify-center border-b border-white/10 bg-[#17191d] text-white transition-colors hover:bg-[#20242b]"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={() => reactFlow.zoomOut({ duration: 180 })}
          className="flex h-8 w-8 items-center justify-center border-b border-white/10 bg-[#17191d] text-white transition-colors hover:bg-[#20242b]"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={() => reactFlow.fitView({ padding: 0.16, duration: 240 })}
          className="flex h-8 w-8 items-center justify-center bg-[#17191d] text-white transition-colors hover:bg-[#20242b]"
          aria-label="Fit view"
          title="Fit view"
        >
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.1} />
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
