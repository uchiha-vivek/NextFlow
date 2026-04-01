"use client";

import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import type { Connection, Edge, Node, NodeProps } from "@xyflow/react";
import {
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
};

type WorkflowNodeType = Node<BaseWorkflowData>;

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
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-[#0f1012] !bg-[#6ea5ff]"
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
          position={Position.Right}
          className="!static !h-3 !w-3 !translate-x-0 !border-2 !border-[#0f1012] !bg-[#6ea5ff]"
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

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#4e7dff]";

function TextNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const [value, setValue] = useState("Describe the scene you want to generate...");

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
          onChange={(event) => setValue(event.target.value)}
          className={`${inputClassName} mt-2 min-h-[110px] resize-none`}
        />
      </div>
    </NodeShell>
  );
}

function ImageUploadNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("No image selected");

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
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              setPreview(URL.createObjectURL(file));
            }}
          />
          Upload image
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
      </div>
    </NodeShell>
  );
}

function VideoUploadNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("No video selected");

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
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              setPreview(URL.createObjectURL(file));
            }}
          />
          Upload video
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
      </div>
    </NodeShell>
  );
}

function LlmNode({ id, data }: NodeProps<WorkflowNodeType>) {
  const [model, setModel] = useState("gpt-4.1-mini");
  const [imageCount, setImageCount] = useState(0);

  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={Sparkles}
      outputLabel="LLM output"
      nodeId={id}
    >
      <div>
        <FieldLabel>Model</FieldLabel>
        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className={`${inputClassName} mt-2`}
        >
          <option>gpt-4.1-mini</option>
          <option>gpt-4.1</option>
          <option>gpt-4o-mini</option>
          <option>gemini-1.5-pro</option>
        </select>
      </div>
      <div>
        <FieldLabel>System prompt</FieldLabel>
        <textarea
          className={`${inputClassName} mt-2 min-h-[80px] resize-none`}
          defaultValue="You are a creative workflow planner."
        />
      </div>
      <div>
        <FieldLabel>User message</FieldLabel>
        <textarea
          className={`${inputClassName} mt-2 min-h-[96px] resize-none`}
          defaultValue="Turn the uploaded input into a polished campaign-ready result."
        />
      </div>
      <div>
        <FieldLabel>Images input</FieldLabel>
        <label className="mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-zinc-300">
          <span>{imageCount} image(s) attached</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(event) => setImageCount(event.target.files?.length ?? 0)}
          />
          <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[12px]">
            Choose
          </span>
        </label>
        <div className="mt-2 text-[12px] text-zinc-500">
          Executes via Trigger.dev task
        </div>
      </div>
    </NodeShell>
  );
}

function CropNode({ id, data }: NodeProps<WorkflowNodeType>) {
  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={Crop}
      outputLabel="Cropped image"
      nodeId={id}
    >
      <div>
        <FieldLabel>Image input URL</FieldLabel>
        <input
          className={`${inputClassName} mt-2`}
          placeholder="https://example.com/input-image.png"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["X %", "10"],
          ["Y %", "15"],
          ["Width %", "65"],
          ["Height %", "55"],
        ].map(([label, value]) => (
          <div key={label}>
            <FieldLabel>{label}</FieldLabel>
            <input className={`${inputClassName} mt-2`} defaultValue={value} />
          </div>
        ))}
      </div>
      <div className="text-[12px] text-zinc-500">
        Executes via FFmpeg on Trigger.dev
      </div>
    </NodeShell>
  );
}

function ExtractFrameNode({ id, data }: NodeProps<WorkflowNodeType>) {
  return (
    <NodeShell
      accent={data.accent}
      title={data.title}
      icon={PanelsTopLeft}
      outputLabel="Frame image"
      nodeId={id}
    >
      <div>
        <FieldLabel>Video URL input</FieldLabel>
        <input
          className={`${inputClassName} mt-2`}
          placeholder="https://example.com/video.mp4"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Timestamp</FieldLabel>
          <input className={`${inputClassName} mt-2`} defaultValue="12.5" />
        </div>
        <div>
          <FieldLabel>Mode</FieldLabel>
          <select className={`${inputClassName} mt-2`} defaultValue="seconds">
            <option value="seconds">Seconds</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-[12px] text-zinc-500">
        Extracts a single frame as image via FFmpeg on Trigger.dev.
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
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
  {
    id: "image-llm",
    source: "imageUpload-1",
    target: "llm-1",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
];

function WorkflowCanvasInner() {
  const { request } = useWorkflowBuilder();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlow = useReactFlow();
  const handledRequestId = useRef<number | null>(null);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#4e7dff", strokeWidth: 2 },
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
        defaultEdgeOptions={{ type: "smoothstep", animated: true }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        nodesDraggable
        nodesConnectable
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

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
