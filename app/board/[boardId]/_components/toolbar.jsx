"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  Cloud,
  Database,
  Diamond,
  Download,
  Eraser,
  FileText,
  Hexagon,
  Highlighter,
  Image as ImageIcon,
  MessageSquare,
  MousePointer2,
  MoveRight,
  Pencil,
  Redo2,
  Shapes,
  Slash,
  Square,
  Star,
  StickyNote,
  Triangle,
  Type,
  Undo2,
} from "lucide-react";
import { CanvasMode, LayerType } from "@/types/canvas";
import { ToolButton } from "./tool-button";

const shapeTools = [
  { label: "Rectangle", icon: Square, type: LayerType.Rectangle },
  { label: "Rounded rectangle", icon: Shapes, type: LayerType.RoundedRectangle },
  { label: "Ellipse", icon: Circle, type: LayerType.Ellipse },
  { label: "Triangle", icon: Triangle, type: LayerType.Triangle },
  { label: "Diamond", icon: Diamond, type: LayerType.Diamond },
  { label: "Parallelogram", icon: Shapes, type: LayerType.Parallelogram },
  { label: "Trapezoid", icon: Shapes, type: LayerType.Trapezoid },
  { label: "Hexagon", icon: Hexagon, type: LayerType.Hexagon },
  { label: "Pentagon", icon: Shapes, type: LayerType.Pentagon },
  { label: "Star", icon: Star, type: LayerType.Star },
  { label: "Cloud", icon: Cloud, type: LayerType.Cloud },
  { label: "Cylinder / database", icon: Database, type: LayerType.Cylinder },
  { label: "Document", icon: FileText, type: LayerType.Document },
  { label: "Speech bubble", icon: MessageSquare, type: LayerType.SpeechBubble },
  { label: "Block arrow", icon: MoveRight, type: LayerType.BlockArrow },
  { label: "Line", icon: Slash, type: LayerType.Line },
];

export const Toolbar = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  onImageUpload,
  onClearBoard,
  onExport,
}) => {
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const shapeMenuRef = useRef(null);

  const insert = (layerType) => setCanvasState({ mode: CanvasMode.Inserting, layerType });
  const active = (layerType) => canvasState.mode === CanvasMode.Inserting && canvasState.layerType === layerType;
  const isShapeActive = shapeTools.some((tool) => active(tool.type));

  const selectShape = (layerType) => {
    insert(layerType);
    setIsShapeMenuOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!shapeMenuRef.current?.contains(event.target)) {
        setIsShapeMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  if (!isToolbarOpen) {
    return (
      <div className="absolute left-4 top-[74px] z-50">
        <button
          type="button"
          onClick={() => setIsToolbarOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white/95 text-neutral-700 shadow-xl backdrop-blur-sm transition hover:bg-neutral-50 hover:text-neutral-950"
          title="Open toolbar"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-[74px] z-50">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white/95 px-2 py-2 shadow-xl backdrop-blur-sm">
        <div className="flex w-full items-center justify-between border-b border-neutral-200 pb-2">
          <span className="px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Tools</span>
          <button
            type="button"
            onClick={() => {
              setIsShapeMenuOpen(false);
              setIsToolbarOpen(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            title="Collapse toolbar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 border-b border-neutral-200 pb-2">
          <ToolButton
            side="right"
            label="Select"
            icon={MousePointer2}
            onClick={() => setCanvasState({ mode: CanvasMode.None })}
            isActive={[
              CanvasMode.None,
              CanvasMode.Translating,
              CanvasMode.SelectionNet,
              CanvasMode.Pressing,
              CanvasMode.Resizing,
            ].includes(canvasState.mode)}
          />
          <ToolButton side="right" label="Text" icon={Type} onClick={() => insert(LayerType.Text)} isActive={active(LayerType.Text)} />
          <ToolButton side="right" label="Sticky note" icon={StickyNote} onClick={() => insert(LayerType.Note)} isActive={active(LayerType.Note)} />
        </div>

        <div ref={shapeMenuRef} className="relative flex flex-col items-center border-b border-neutral-200 pb-2">
          <ToolButton
            side="right"
            label="Shapes"
            icon={Shapes}
            onClick={() => setIsShapeMenuOpen((current) => !current)}
            isActive={isShapeMenuOpen || isShapeActive}
          />

          {isShapeMenuOpen && (
            <div className="absolute left-[54px] top-0 z-[80] w-[340px] rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between px-1">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Shapes</p>
                  <p className="text-xs text-neutral-500">Choose a shape to place on the board</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {shapeTools.map((tool) => {
                  const Icon = tool.icon;
                  const isActiveShape = active(tool.type);

                  return (
                    <button
                      key={tool.label}
                      type="button"
                      onClick={() => selectShape(tool.type)}
                      className={`group flex h-[68px] flex-col items-center justify-center gap-1 rounded-xl border text-xs transition-all duration-150 ${
                        isActiveShape
                          ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-neutral-100 bg-white text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-950"
                      }`}
                      title={tool.label}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="max-w-[66px] truncate text-center leading-tight">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 border-b border-neutral-200 pb-2">
          <ToolButton side="right" label="Pen" icon={Pencil} onClick={() => setCanvasState({ mode: CanvasMode.Pencil })} isActive={canvasState.mode === CanvasMode.Pencil} />
          <ToolButton side="right" label="Highlighter" icon={Highlighter} onClick={() => setCanvasState({ mode: CanvasMode.Highlighter })} isActive={canvasState.mode === CanvasMode.Highlighter} />
          <ToolButton side="right" label="Connector arrow" icon={ArrowRight} onClick={() => setCanvasState({ mode: CanvasMode.Connector, fromId: null })} isActive={canvasState.mode === CanvasMode.Connector} />
          <ToolButton side="right" label="Upload image" icon={ImageIcon} onClick={onImageUpload} />
        </div>

        <div className="flex flex-col items-center gap-1 border-b border-neutral-200 pb-2">
          <ToolButton side="right" label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
          <ToolButton side="right" label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <ToolButton side="right" label="Export" icon={Download} onClick={onExport} />
          <ToolButton side="right" label="Clear board" icon={Eraser} onClick={onClearBoard} />
        </div>
      </div>
    </div>
  );
};

export const ToolbarSkeleton = () => (
  <div className="absolute left-4 top-[74px]">
    <div className="h-[420px] w-[62px] rounded-2xl border border-neutral-200 bg-white shadow-xl" />
  </div>
);
