"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Connection, Edge, Node, NodeProps } from "@xyflow/react";
import { Bot, Database, Play, Sparkles, WandSparkles } from "lucide-react";
import { useCallback } from "react";

type WorkflowNodeData = {
  title: string;
  caption: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: string;
};

function WorkflowNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
  const Icon = data.icon;

  return (
    <div className="min-w-[220px] select-none rounded-[22px] border border-white/10 bg-[#101113]/95 p-4 shadow-[0_22px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-[#0f1012] !bg-[#6ea5ff]"
      />
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${data.tone}`}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[-0.03em] text-white">
            {data.title}
          </div>
          <div className="mt-1 text-[13px] leading-5 text-zinc-400">
            {data.caption}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-[#0f1012] !bg-[#6ea5ff]"
      />
    </div>
  );
}

const nodeTypes = {
  workflow: WorkflowNode,
};

const initialNodes: Node<WorkflowNodeData>[] = [
  {
    id: "brief",
    type: "workflow",
    position: { x: 60, y: 140 },
    data: {
      title: "Creative Brief",
      caption: "Goal, prompt rules, brand tone, and required output format.",
      icon: Sparkles,
      tone: "bg-[linear-gradient(135deg,#7a5cff_0%,#b38cff_100%)]",
    },
  },
  {
    id: "assets",
    type: "workflow",
    position: { x: 370, y: 55 },
    data: {
      title: "Assets Intake",
      caption: "Images, references, product shots, and reusable templates.",
      icon: Database,
      tone: "bg-[linear-gradient(135deg,#1e88ff_0%,#58b4ff_100%)]",
    },
  },
  {
    id: "agent",
    type: "workflow",
    position: { x: 370, y: 235 },
    data: {
      title: "Planning Agent",
      caption: "Breaks the brief into steps, validates constraints, and drafts prompts.",
      icon: Bot,
      tone: "bg-[linear-gradient(135deg,#ff8f3d_0%,#ffba64_100%)]",
    },
  },
  {
    id: "generate",
    type: "workflow",
    position: { x: 700, y: 140 },
    data: {
      title: "Generate",
      caption: "Runs the selected model path with smooth preview updates and revisions.",
      icon: WandSparkles,
      tone: "bg-[linear-gradient(135deg,#00c389_0%,#28e1a8_100%)]",
    },
  },
  {
    id: "publish",
    type: "workflow",
    position: { x: 1010, y: 140 },
    data: {
      title: "Review + Publish",
      caption: "Approvals, exports, and handoff to the final destination.",
      icon: Play,
      tone: "bg-[linear-gradient(135deg,#f4b400_0%,#ffd84d_100%)]",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "brief-assets",
    source: "brief",
    target: "assets",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
  {
    id: "brief-agent",
    source: "brief",
    target: "agent",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
  {
    id: "assets-generate",
    source: "assets",
    target: "generate",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
  {
    id: "agent-generate",
    source: "agent",
    target: "generate",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
  {
    id: "generate-publish",
    source: "generate",
    target: "publish",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4e7dff", strokeWidth: 2 },
  },
];

function WorkflowCanvasInner() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(78,125,255,0.12),transparent_28%),linear-gradient(180deg,#171717_0%,#101010_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.34)] select-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
        <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          Workflow Canvas
        </div>
        <div className="mt-1 text-[24px] font-semibold tracking-[-0.05em] text-white">
          Plan, connect, and ship visually
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.65 }}
        minZoom={0.45}
        maxZoom={1.65}
        defaultEdgeOptions={{ type: "smoothstep", animated: true }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        selectionMode="partial"
        nodesDraggable
        nodesConnectable
        elementsSelectable
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#2f3441"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(7, 8, 10, 0.72)"
          className="!bottom-5 !right-5 !rounded-2xl !border !border-white/10 !bg-[#0e0f12]/90 !shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          nodeColor="#6ea5ff"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bottom-5 !left-5 !overflow-hidden !rounded-2xl !border !border-white/10 !bg-[#0e0f12]/90 !shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        />
      </ReactFlow>
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
