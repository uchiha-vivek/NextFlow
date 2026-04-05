"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const workflow_execution_utils_1 = require("../src/lib/workflow-execution-utils");
function textLookup(entries) {
    return new Map(Object.entries(entries));
}
function urlLookup(entries) {
    return new Map(Object.entries(entries));
}
(0, node_test_1.default)("1. Basic Text To LLM routes text into the LLM user handle", () => {
    const edges = [
        { source: "text-1", target: "llm-1", targetHandle: "user" },
    ];
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", edges, textLookup({ "text-1": "Write launch copy" }), urlLookup({}), {
        systemPrompt: "Manual system",
        userMessage: "",
    });
    strict_1.default.equal(resolved.systemPrompt, "Manual system");
    strict_1.default.equal(resolved.userMessage, "Write launch copy");
    strict_1.default.deepEqual(resolved.imageUrls, []);
});
(0, node_test_1.default)("2. Two Text Nodes Into LLM routes system and user independently", () => {
    const edges = [
        { source: "text-system", target: "llm-1", targetHandle: "system" },
        { source: "text-user", target: "llm-1", targetHandle: "user" },
    ];
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", edges, textLookup({
        "text-system": "You are a luxury brand copywriter.",
        "text-user": "Describe this new release.",
    }), urlLookup({}), {
        systemPrompt: "Fallback system",
        userMessage: "Fallback user",
    });
    strict_1.default.equal(resolved.systemPrompt, "You are a luxury brand copywriter.");
    strict_1.default.equal(resolved.userMessage, "Describe this new release.");
    strict_1.default.deepEqual(resolved.imageUrls, []);
});
(0, node_test_1.default)("3. Upload Image To LLM Vision routes image URLs into the images handle", () => {
    const edges = [
        { source: "text-1", target: "llm-1", targetHandle: "user" },
        { source: "image-upload-1", target: "llm-1", targetHandle: "images" },
    ];
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", edges, textLookup({ "text-1": "Describe this product image in marketing language." }), urlLookup({ "image-upload-1": "https://cdn.example.com/product.png" }), {
        systemPrompt: "Manual system",
        userMessage: "",
    });
    strict_1.default.equal(resolved.userMessage, "Describe this product image in marketing language.");
    strict_1.default.deepEqual(resolved.imageUrls, ["https://cdn.example.com/product.png"]);
});
(0, node_test_1.default)("4. Upload Image To Crop uses the upstream upload URL as crop input", () => {
    const edges = [{ source: "image-upload-1", target: "crop-1" }];
    const resolved = (0, workflow_execution_utils_1.resolveConnectedMediaInput)("crop-1", edges, urlLookup({ "image-upload-1": "https://cdn.example.com/source.png" }), "");
    strict_1.default.equal(resolved, "https://cdn.example.com/source.png");
});
(0, node_test_1.default)("5. Upload Image To Crop To LLM sends the cropped image to the LLM images handle", () => {
    const edges = [
        { source: "text-system", target: "llm-1", targetHandle: "system" },
        { source: "text-user", target: "llm-1", targetHandle: "user" },
        { source: "crop-1", target: "llm-1", targetHandle: "images" },
    ];
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", edges, textLookup({
        "text-system": "You are a product marketer.",
        "text-user": "Turn this crop into a PDP hero description.",
    }), urlLookup({ "crop-1": "https://cdn.example.com/cropped.png" }), {
        systemPrompt: "Fallback system",
        userMessage: "",
    });
    strict_1.default.equal(resolved.systemPrompt, "You are a product marketer.");
    strict_1.default.equal(resolved.userMessage, "Turn this crop into a PDP hero description.");
    strict_1.default.deepEqual(resolved.imageUrls, ["https://cdn.example.com/cropped.png"]);
});
(0, node_test_1.default)("6. Upload Video To Extract Frame uses the upstream video URL as frame input", () => {
    const edges = [{ source: "video-upload-1", target: "frame-1" }];
    const resolved = (0, workflow_execution_utils_1.resolveConnectedMediaInput)("frame-1", edges, urlLookup({ "video-upload-1": "https://cdn.example.com/demo.mp4" }), "");
    strict_1.default.equal(resolved, "https://cdn.example.com/demo.mp4");
});
(0, node_test_1.default)("7. Upload Video To Extract Frame To LLM sends the frame image to the LLM images handle", () => {
    const edges = [
        { source: "text-1", target: "llm-1", targetHandle: "user" },
        { source: "frame-1", target: "llm-1", targetHandle: "images" },
    ];
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", edges, textLookup({ "text-1": "Describe this frame as a social media visual." }), urlLookup({ "frame-1": "https://cdn.example.com/frame.png" }), {
        systemPrompt: "Manual system",
        userMessage: "",
    });
    strict_1.default.equal(resolved.userMessage, "Describe this frame as a social media visual.");
    strict_1.default.deepEqual(resolved.imageUrls, ["https://cdn.example.com/frame.png"]);
});
(0, node_test_1.default)("8. Full Parallel Marketing Workflow preserves parallel branches and final convergence inputs", () => {
    const nodes = [
        { id: "image-upload-1", type: "imageUpload", data: {} },
        { id: "text-system-a", type: "text", data: {} },
        { id: "text-user-a", type: "text", data: {} },
        { id: "crop-1", type: "crop", data: {} },
        { id: "llm-1", type: "llm", data: {} },
        { id: "video-upload-1", type: "videoUpload", data: {} },
        { id: "frame-1", type: "extractFrame", data: {} },
        { id: "text-system-final", type: "text", data: {} },
        { id: "llm-2", type: "llm", data: {} },
    ];
    const edges = [
        { source: "image-upload-1", target: "crop-1" },
        { source: "text-system-a", target: "llm-1", targetHandle: "system" },
        { source: "text-user-a", target: "llm-1", targetHandle: "user" },
        { source: "crop-1", target: "llm-1", targetHandle: "images" },
        { source: "video-upload-1", target: "frame-1" },
        { source: "text-system-final", target: "llm-2", targetHandle: "system" },
        { source: "llm-1", target: "llm-2", targetHandle: "user" },
        { source: "crop-1", target: "llm-2", targetHandle: "images" },
        { source: "frame-1", target: "llm-2", targetHandle: "images" },
    ];
    const levels = (0, workflow_execution_utils_1.getTopologicalLevels)(nodes, edges);
    strict_1.default.deepEqual(levels, [
        ["image-upload-1", "text-system-a", "text-user-a", "video-upload-1", "text-system-final"],
        ["crop-1", "frame-1"],
        ["llm-1"],
        ["llm-2"],
    ]);
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-2", edges, textLookup({
        "text-system-final": "Combine inputs into one final campaign narrative.",
        "llm-1": "Branch A product marketing analysis",
    }), urlLookup({
        "crop-1": "https://cdn.example.com/crop.png",
        "frame-1": "https://cdn.example.com/frame.png",
    }), {
        systemPrompt: "Fallback system",
        userMessage: "",
    });
    strict_1.default.equal(resolved.systemPrompt, "Combine inputs into one final campaign narrative.");
    strict_1.default.equal(resolved.userMessage, "Branch A product marketing analysis");
    strict_1.default.deepEqual(resolved.imageUrls, [
        "https://cdn.example.com/crop.png",
        "https://cdn.example.com/frame.png",
    ]);
});
(0, node_test_1.default)("9. Multiple Images Into One LLM preserves both image inputs", () => {
    const edges = [
        { source: "text-1", target: "llm-1", targetHandle: "user" },
        { source: "crop-1", target: "llm-1", targetHandle: "images" },
        { source: "frame-1", target: "llm-1", targetHandle: "images" },
    ];
    const resolved = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", edges, textLookup({ "text-1": "Compare these visuals." }), urlLookup({
        "crop-1": "https://cdn.example.com/crop.png",
        "frame-1": "https://cdn.example.com/frame.png",
    }), {
        systemPrompt: "Fallback system",
        userMessage: "",
    });
    strict_1.default.equal(resolved.userMessage, "Compare these visuals.");
    strict_1.default.deepEqual(resolved.imageUrls, [
        "https://cdn.example.com/crop.png",
        "https://cdn.example.com/frame.png",
    ]);
});
(0, node_test_1.default)("10. Selected Nodes Run can execute only the chosen subset while ignoring unselected upstream nodes", () => {
    const selectedNodes = [
        { id: "crop-1", type: "crop", data: {} },
        { id: "llm-1", type: "llm", data: {} },
    ];
    const allEdges = [
        { source: "image-upload-1", target: "crop-1" },
        { source: "crop-1", target: "llm-1", targetHandle: "images" },
        { source: "text-1", target: "llm-1", targetHandle: "user" },
    ];
    strict_1.default.deepEqual((0, workflow_execution_utils_1.getTopologicalLevels)(selectedNodes, allEdges), [["crop-1"], ["llm-1"]]);
    const cropInput = (0, workflow_execution_utils_1.resolveConnectedMediaInput)("crop-1", allEdges, urlLookup({}), "https://manual.example.com/fallback.png");
    const llmInputs = (0, workflow_execution_utils_1.resolveLlmInputs)("llm-1", allEdges, textLookup({}), urlLookup({ "crop-1": "https://cdn.example.com/crop.png" }), {
        systemPrompt: "Manual system",
        userMessage: "Manual user prompt",
    });
    strict_1.default.equal(cropInput, "https://manual.example.com/fallback.png");
    strict_1.default.equal(llmInputs.userMessage, "Manual user prompt");
    strict_1.default.deepEqual(llmInputs.imageUrls, ["https://cdn.example.com/crop.png"]);
});
