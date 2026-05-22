"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveObject } from "@liveblocks/client";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";

import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from "@/liveblocks.config";
import { supabase } from "@/lib/supabase/client";
import { getBoardAccess } from "@/lib/boards";
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  getLayerBounds,
  getLayerCenter,
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
  resizeBounds,
} from "@/lib/utils";
import { ArrowTypes, CanvasMode, ConnectorTypes, LayerType } from "@/types/canvas";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { Info } from "./info";
import { Path } from "./path";
import { Toolbar } from "./toolbar";
import { Participants } from "./participants";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { CursorsPresence } from "./cursors-presence";

const MAX_LAYERS = 250;
const IMAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || "board-images";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function liveObjectToPlain(layer) {
  if (!layer) return null;

  return {
    type: layer.get("type"),
    x: layer.get("x"),
    y: layer.get("y"),
    width: layer.get("width"),
    height: layer.get("height"),
    endX: layer.get("endX"),
    endY: layer.get("endY"),
    points: layer.get("points"),
  };
}

function normalizePoints(points) {
  return Array.isArray(points)
    ? points.filter((point) => typeof point?.x === "number" && typeof point?.y === "number")
    : [];
}

function getLayerCopyData(layer) {
  if (!layer) return null;

  const keys = [
    "type",
    "x",
    "y",
    "width",
    "height",
    "fill",
    "value",
    "src",
    "points",
    "strokeSize",
    "opacity",
    "isHighlighter",
    "endX",
    "endY",
    "fromId",
    "toId",
    "stroke",
    "strokeWidth",
    "arrowStart",
    "arrowEnd",
    "arrowSize",
    "connectorType",
    "lineDash",
  ];

  const data = {};

  for (const key of keys) {
    const value = layer.get(key);
    if (value !== undefined) {
      data[key] = value;
    }
  }

  return JSON.parse(JSON.stringify(data));
}

function offsetCopiedLayerData(layer, offset) {
  const next = JSON.parse(JSON.stringify(layer));

  if (typeof next.x === "number") next.x += offset.x;
  if (typeof next.y === "number") next.y += offset.y;
  if (typeof next.endX === "number") next.endX += offset.x;
  if (typeof next.endY === "number") next.endY += offset.y;

  if (Array.isArray(next.points)) {
    next.points = next.points.map((point) => ({
      ...point,
      x: typeof point.x === "number" ? point.x + offset.x : point.x,
      y: typeof point.y === "number" ? point.y + offset.y : point.y,
    }));
  }

  // Duplicated connectors become standalone connectors so they do not remain
  // attached to the original copied shapes.
  if (next.type === LayerType.Connector) {
    next.fromId = null;
    next.toId = null;
  }

  return next;
}

function getConnectorVisualEndpoints(liveLayers, connectorLayer) {
  const fromLayer = connectorLayer.get("fromId") ? liveLayers.get(connectorLayer.get("fromId")) : null;
  const toLayer = connectorLayer.get("toId") ? liveLayers.get(connectorLayer.get("toId")) : null;
  const fromPlain = liveObjectToPlain(fromLayer);
  const toPlain = liveObjectToPlain(toLayer);

  return {
    start: fromPlain ? getLayerCenter(fromPlain) : { x: connectorLayer.get("x"), y: connectorLayer.get("y") },
    end: toPlain ? getLayerCenter(toPlain) : { x: connectorLayer.get("endX"), y: connectorLayer.get("endY") },
  };
}

function getDefaultLayerSize(layerType) {
  if (layerType === LayerType.Note) return { width: 220, height: 220 };
  if (layerType === LayerType.Text) return { width: 220, height: 60 };
  if (layerType === LayerType.Star || layerType === LayerType.Cloud) return { width: 150, height: 130 };
  if (layerType === LayerType.Cylinder) return { width: 150, height: 120 };
  if (layerType === LayerType.Document || layerType === LayerType.SpeechBubble) return { width: 170, height: 120 };
  if (layerType === LayerType.BlockArrow) return { width: 180, height: 90 };
  if (layerType === LayerType.Line) return { width: 180, height: 0 };
  return { width: 150, height: 100 };
}

function connectorDefaultPoints(start, end, connectorType) {
  if (connectorType === ConnectorTypes.Elbow) {
    const midX = start.x + (end.x - start.x) / 2;
    return [
      { x: midX, y: start.y },
      { x: midX, y: end.y },
    ];
  }

  if (connectorType === ConnectorTypes.Curved) {
    return [
      { x: start.x + Math.abs(end.x - start.x) * 0.45, y: start.y },
      { x: end.x - Math.abs(end.x - start.x) * 0.45, y: end.y },
    ];
  }

  if (connectorType === ConnectorTypes.Freeform) {
    return [{ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }];
  }

  return [];
}

function connectorBounds(start, end, points = []) {
  const allPoints = [start, ...normalizePoints(points), end];
  const xs = allPoints.map((point) => point.x);
  const ys = allPoints.map((point) => point.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs) || 1,
    height: Math.max(...ys) - Math.min(...ys) || 1,
  };
}

export const Canvas = ({ boardId }) => {
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const copiedLayersRef = useRef([]);
  const storedLayerIds = useStorage((root) => root.layerIds);
  const layerIds = useMemo(() => (Array.isArray(storedLayerIds) ? storedLayerIds : []), [storedLayerIds]);
  const pencilDraft = useSelf((me) => me.presence.pencilDraft);

  const [canvasState, setCanvasState] = useState({ mode: CanvasMode.None });
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [lastUsedColor, setLastUsedColor] = useState({ r: 0, g: 0, b: 0 });
  const [access, setAccess] = useState({ canView: true, canEdit: true, loading: true, isGuest: false });
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAccess() {
      try {
        const nextAccess = await getBoardAccess(boardId);
        if (mounted) setAccess({ ...nextAccess, loading: false });
      } catch {
        if (mounted) setAccess({ canView: false, canEdit: false, loading: false, isGuest: false });
      }
    }

    loadAccess();
    const interval = window.setInterval(loadAccess, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [boardId]);

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation(({ storage, setMyPresence }, layerType, position, options = {}) => {
    if (!access.canEdit) return null;

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    if (!liveLayers || !liveLayerIds || liveLayers.size >= MAX_LAYERS) return null;

    const layerId = nanoid();
    const size = getDefaultLayerSize(layerType);
    const baseLayer = {
      type: layerType,
      x: position.x,
      y: position.y,
      height: options.height ?? size.height,
      width: options.width ?? size.width,
      fill: options.fill || lastUsedColor,
      value: options.value || "",
      src: options.src,
    };

    if (layerType === LayerType.Line) {
      baseLayer.endX = position.x + 180;
      baseLayer.endY = position.y;
      baseLayer.stroke = lastUsedColor;
      baseLayer.strokeWidth = 2;
    }

    liveLayerIds.push(layerId);
    liveLayers.set(layerId, new LiveObject(baseLayer));
    setMyPresence({ selection: [layerId] }, { addToHistory: true });
    setCanvasState({ mode: CanvasMode.None });
    return layerId;
  }, [lastUsedColor, access.canEdit]);

  const insertImageLayer = useMutation(({ storage, setMyPresence }, image) => {
    if (!access.canEdit) return;

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    if (!liveLayers || !liveLayerIds || liveLayers.size >= MAX_LAYERS) return;

    const layerId = nanoid();
    liveLayerIds.push(layerId);
    liveLayers.set(layerId, new LiveObject({
      type: LayerType.Image,
      x: image.x,
      y: image.y,
      width: image.width,
      height: image.height,
      src: image.src,
      fill: { r: 255, g: 255, b: 255 },
    }));
    setMyPresence({ selection: [layerId] }, { addToHistory: true });
  }, [access.canEdit]);

  const insertConnector = useMutation(({ storage, setMyPresence }, fromId, toId) => {
    if (!access.canEdit || !fromId || !toId || fromId === toId) return;

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    if (!liveLayers || !liveLayerIds || liveLayers.size >= MAX_LAYERS) return;

    const fromLayer = liveObjectToPlain(liveLayers.get(fromId));
    const toLayer = liveObjectToPlain(liveLayers.get(toId));
    if (!fromLayer || !toLayer || fromLayer.type === LayerType.Connector || toLayer.type === LayerType.Connector) return;

    const start = getLayerCenter(fromLayer);
    const end = getLayerCenter(toLayer);
    const connectorType = ConnectorTypes.Elbow;
    const points = connectorDefaultPoints(start, end, connectorType);
    const bounds = connectorBounds(start, end, points);
    const layerId = nanoid();

    liveLayerIds.push(layerId);
    liveLayers.set(layerId, new LiveObject({
      type: LayerType.Connector,
      x: start.x,
      y: start.y,
      endX: end.x,
      endY: end.y,
      width: bounds.width,
      height: bounds.height,
      points,
      fromId,
      toId,
      stroke: { r: 31, g: 41, b: 55 },
      strokeWidth: 2,
      arrowStart: ArrowTypes.None,
      arrowEnd: ArrowTypes.Arrow,
      arrowSize: 12,
      connectorType,
      lineDash: "solid",
      fill: { r: 31, g: 41, b: 55 },
    }));

    setMyPresence({ selection: [layerId] }, { addToHistory: true });
    setCanvasState({ mode: CanvasMode.None });
  }, [access.canEdit]);

  const clearBoard = useMutation(({ storage, setMyPresence }) => {
    if (!access.canEdit) return;

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    if (!liveLayers || !liveLayerIds) return;

    const ids = liveLayerIds.toImmutable ? liveLayerIds.toImmutable() : [...liveLayerIds];
    ids.forEach((id) => liveLayers.delete(id));

    for (let i = liveLayerIds.length - 1; i >= 0; i--) {
      liveLayerIds.delete(i);
    }

    setMyPresence({ selection: [], pencilDraft: null }, { addToHistory: true });
  }, [access.canEdit]);

  const translateSelectedLayers = useMutation(({ storage, self }, point) => {
    if (!access.canEdit || canvasState.mode !== CanvasMode.Translating) return;

    const offset = {
      x: point.x - canvasState.current.x,
      y: point.y - canvasState.current.y,
    };

    const liveLayers = storage.get("layers");
    if (!liveLayers) return;

    for (const id of self.presence.selection || []) {
      const layer = liveLayers.get(id);
      if (!layer) continue;

      if (layer.get("type") === LayerType.Connector) {
        const { start, end } = getConnectorVisualEndpoints(liveLayers, layer);
        const points = normalizePoints(layer.get("points")).map((point) => ({ x: point.x + offset.x, y: point.y + offset.y }));
        const nextStart = { x: start.x + offset.x, y: start.y + offset.y };
        const nextEnd = { x: end.x + offset.x, y: end.y + offset.y };
        const bounds = connectorBounds(nextStart, nextEnd, points);

        layer.update({
          x: nextStart.x,
          y: nextStart.y,
          endX: nextEnd.x,
          endY: nextEnd.y,
          points,
          fromId: null,
          toId: null,
          width: bounds.width,
          height: bounds.height,
        });
      } else if (layer.get("type") === LayerType.Line) {
        layer.update({
          x: layer.get("x") + offset.x,
          y: layer.get("y") + offset.y,
          endX: layer.get("endX") + offset.x,
          endY: layer.get("endY") + offset.y,
        });
      } else {
        layer.update({ x: layer.get("x") + offset.x, y: layer.get("y") + offset.y });
      }
    }

    setCanvasState({ mode: CanvasMode.Translating, current: point });
  }, [canvasState, access.canEdit]);

  const updateConnectorEndpoint = useMutation(({ storage }, point) => {
    if (!access.canEdit || canvasState.mode !== CanvasMode.ConnectorEndpoint) return;

    const liveLayers = storage.get("layers");
    const layer = liveLayers?.get(canvasState.connectorId);
    if (!layer || layer.get("type") !== LayerType.Connector) return;

    const currentPoints = normalizePoints(layer.get("points"));
    let nextPoints = [...currentPoints];

    if (canvasState.endpoint === "start") {
      layer.update({ x: point.x, y: point.y, fromId: null });
    } else if (canvasState.endpoint === "end") {
      layer.update({ endX: point.x, endY: point.y, toId: null });
    } else if (canvasState.endpoint === "point") {
      nextPoints[canvasState.pointIndex] = point;
      layer.update({ points: nextPoints });
    } else if (canvasState.endpoint === "virtual") {
      nextPoints[canvasState.pointIndex ?? 0] = point;
      layer.update({ points: nextPoints });
    }

    const start = { x: layer.get("x"), y: layer.get("y") };
    const end = { x: layer.get("endX"), y: layer.get("endY") };
    const bounds = connectorBounds(start, end, nextPoints);
    layer.update({ width: bounds.width, height: bounds.height });
  }, [canvasState, access.canEdit]);

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if ((self.presence.selection || []).length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(({ storage, setMyPresence }, current, origin) => {
    const liveLayers = storage.get("layers");
    if (!liveLayers) return;

    const layers = liveLayers.toImmutable();
    setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
    setMyPresence({ selection: findIntersectingLayersWithRectangle(layerIds, layers, origin, current) });
  }, [layerIds]);

  const startMultiSelection = useCallback((current, origin) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
    }
  }, []);

  const continueDrawing = useMutation(({ self, setMyPresence }, point, e) => {
    if (!access.canEdit) return;

    const { pencilDraft } = self.presence;
    const isDrawingMode = canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Highlighter;

    if (!isDrawingMode || e.buttons !== 1 || pencilDraft == null) return;

    setMyPresence({
      cursor: point,
      pencilDraft:
        pencilDraft.length === 1 && pencilDraft[0][0] === point.x && pencilDraft[0][1] === point.y
          ? pencilDraft
          : [...pencilDraft, [point.x, point.y, e.pressure]],
    });
  }, [canvasState.mode, access.canEdit]);

  const insertPath = useMutation(({ storage, self, setMyPresence }) => {
    if (!access.canEdit) {
      setMyPresence({ pencilDraft: null });
      return;
    }

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    const { pencilDraft } = self.presence;

    if (!liveLayers || !liveLayerIds || pencilDraft == null || pencilDraft.length < 2 || liveLayers.size >= MAX_LAYERS) {
      setMyPresence({ pencilDraft: null });
      return;
    }

    const isHighlighter = canvasState.mode === CanvasMode.Highlighter;
    const id = nanoid();

    liveLayers.set(
      id,
      new LiveObject(
        penPointsToPathLayer(pencilDraft, isHighlighter ? { r: 250, g: 204, b: 21 } : lastUsedColor, {
          strokeSize: isHighlighter ? 28 : 16,
          opacity: isHighlighter ? 0.35 : 1,
          isHighlighter,
        })
      )
    );
    liveLayerIds.push(id);
    setMyPresence({ pencilDraft: null });
    setCanvasState({ mode: isHighlighter ? CanvasMode.Highlighter : CanvasMode.Pencil });
  }, [lastUsedColor, canvasState.mode, access.canEdit]);

  const startDrawing = useMutation(({ setMyPresence }, point, pressure) => {
    if (!access.canEdit) return;
    setMyPresence({ pencilDraft: [[point.x, point.y, pressure]], penColor: lastUsedColor });
  }, [lastUsedColor, access.canEdit]);

  const resizeSelectedLayer = useMutation(({ storage, self }, point) => {
    if (!access.canEdit || canvasState.mode !== CanvasMode.Resizing) return;

    const bounds = resizeBounds(canvasState.initialBounds, canvasState.corner, point);
    const liveLayers = storage.get("layers");
    const selectedLayerId = self.presence.selection?.[0];
    const layer = selectedLayerId ? liveLayers?.get(selectedLayerId) : null;

    if (layer && layer.get("type") !== LayerType.Connector) {
      layer.update(bounds);
    }
  }, [canvasState, access.canEdit]);

  const onResizeHandlePointerDown = useCallback((corner, initialBounds) => {
    history.pause();
    setCanvasState({ mode: CanvasMode.Resizing, initialBounds, corner });
  }, [history]);

  const onConnectorHandlePointerDown = useCallback((e, connectorId, endpoint, pointIndex = null) => {
    if (!access.canEdit) return;

    e.stopPropagation();
    history.pause();
    setCanvasState({ mode: CanvasMode.ConnectorEndpoint, connectorId, endpoint, pointIndex });
  }, [history, access.canEdit]);

  const onWheel = useCallback((e) => {
    setCamera((camera) => ({ x: camera.x - e.deltaX, y: camera.y - e.deltaY }));
  }, []);

  const onPointerMove = useMutation(({ setMyPresence }, e) => {
    const current = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === CanvasMode.Pressing) startMultiSelection(current, canvasState.origin);
    else if (canvasState.mode === CanvasMode.SelectionNet) updateSelectionNet(current, canvasState.origin);
    else if (canvasState.mode === CanvasMode.Translating) translateSelectedLayers(current);
    else if (canvasState.mode === CanvasMode.Resizing) resizeSelectedLayer(current);
    else if (canvasState.mode === CanvasMode.ConnectorEndpoint) updateConnectorEndpoint(current);
    else if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Highlighter) continueDrawing(current, e);

    setMyPresence({ cursor: current });
  }, [continueDrawing, camera, canvasState, resizeSelectedLayer, translateSelectedLayers, updateConnectorEndpoint, startMultiSelection, updateSelectionNet]);

  const onPointerLeave = useMutation(({ setMyPresence }) => setMyPresence({ cursor: null }), []);

  const onPointerDown = useCallback((e) => {
    if (!access.canEdit) return;

    const point = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === CanvasMode.Inserting || canvasState.mode === CanvasMode.Connector) return;

    if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Highlighter) {
      startDrawing(point, e.pressure);
      return;
    }

    setCanvasState({ origin: point, mode: CanvasMode.Pressing });
  }, [camera, canvasState.mode, startDrawing, access.canEdit]);

  const onPointerUp = useMutation(({}, e) => {
    if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
      unselectLayers();
      setCanvasState({ mode: CanvasMode.None });
    } else if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Highlighter) {
      insertPath();
    } else if (canvasState.mode === CanvasMode.Inserting) {
      const point = pointerEventToCanvasPoint(e, camera);
      insertLayer(canvasState.layerType, point);
    } else if (canvasState.mode === CanvasMode.ConnectorEndpoint) {
      setCanvasState({ mode: CanvasMode.None });
    } else if (canvasState.mode !== CanvasMode.Connector) {
      setCanvasState({ mode: CanvasMode.None });
    }

    history.resume();
  }, [camera, canvasState, history, insertLayer, unselectLayers, insertPath]);

  const othersSelections = useOthersMapped((other) => other.presence.selection);
  const selections = useMemo(() => othersSelections || [], [othersSelections]);

  const onLayerPointerDown = useMutation(({ self, setMyPresence }, e, layerId) => {
    if (!access.canEdit || [CanvasMode.Pencil, CanvasMode.Highlighter, CanvasMode.Inserting, CanvasMode.ConnectorEndpoint].includes(canvasState.mode)) return;

    e.stopPropagation();

    if (canvasState.mode === CanvasMode.Connector) {
      if (!canvasState.fromId) {
        setCanvasState({ mode: CanvasMode.Connector, fromId: layerId });
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
        toast.info("Now click the object to connect to.");
      } else {
        insertConnector(canvasState.fromId, layerId);
      }
      return;
    }

    history.pause();
    const point = pointerEventToCanvasPoint(e, camera);

    if (!(self.presence.selection || []).includes(layerId)) {
      setMyPresence({ selection: [layerId] }, { addToHistory: true });
    }

    setCanvasState({ mode: CanvasMode.Translating, current: point });
  }, [camera, history, canvasState, insertConnector, access.canEdit]);

  const layerIdsToColorSelection = useMemo(() => {
    const map = {};

    for (const user of selections) {
      const [connectionId, selection] = user;
      for (const layerId of selection || []) map[layerId] = connectionIdToColor(connectionId);
    }

    return map;
  }, [selections]);

  const deleteLayers = useDeleteLayers();

  const copySelectedLayers = useMutation(({ storage, self }) => {
    const liveLayers = storage.get("layers");
    const selection = self.presence.selection || [];

    if (!liveLayers || !selection.length) {
      copiedLayersRef.current = [];
      return;
    }

    copiedLayersRef.current = selection
      .map((id) => getLayerCopyData(liveLayers.get(id)))
      .filter(Boolean);

    if (copiedLayersRef.current.length) {
      toast.success(`${copiedLayersRef.current.length} object${copiedLayersRef.current.length > 1 ? "s" : ""} copied`);
    }
  }, []);

  const pasteCopiedLayers = useMutation(({ storage, setMyPresence }) => {
    if (!access.canEdit) {
      toast.error("You only have view access to this board.");
      return;
    }

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    const copiedLayers = copiedLayersRef.current || [];

    if (!liveLayers || !liveLayerIds || !copiedLayers.length) return;

    const offset = { x: 32, y: 32 };
    const newIds = [];

    for (const copiedLayer of copiedLayers) {
      if (liveLayers.size >= MAX_LAYERS) break;

      const id = nanoid();
      const nextLayer = offsetCopiedLayerData(copiedLayer, offset);

      liveLayers.set(id, new LiveObject(nextLayer));
      liveLayerIds.push(id);
      newIds.push(id);
    }

    if (newIds.length) {
      copiedLayersRef.current = copiedLayers.map((layer) => offsetCopiedLayerData(layer, offset));
      setMyPresence({ selection: newIds }, { addToHistory: true });
      toast.success(`${newIds.length} object${newIds.length > 1 ? "s" : ""} pasted`);
    }
  }, [access.canEdit]);

  const uploadTextLayer = useCallback((rawText, point = null) => {
    if (!access.canEdit) {
      toast.error("You only have view access to this board.");
      return;
    }

    const value = (rawText || "").replace(/\r\n/g, "\n").trim();
    if (!value) return;

    const lines = value.split("\n");
    const longestLineLength = Math.max(...lines.map((line) => line.length), 6);
    const width = Math.max(180, Math.min(420, longestLineLength * 10 + 48));
    const height = Math.max(64, Math.min(260, lines.length * 30 + 32));
    const position = point || {
      x: Math.round(window.innerWidth / 2) - camera.x - width / 2,
      y: Math.round(window.innerHeight / 2) - camera.y - height / 2,
    };

    insertLayer(LayerType.Text, position, { value, width, height });
    toast.success("Text pasted to board");
  }, [access.canEdit, camera, insertLayer]);

  const uploadImageFile = useCallback(async (file, point = null) => {
    if (!access.canEdit) {
      toast.error("You only have view access to this board.");
      return;
    }

    if (!file || !file.type?.startsWith("image/")) return;

    const fallback = await fileToDataUrl(file);
    let src = fallback;

    try {
      const ext = file.name?.split(".").pop() || "png";
      const filePath = `${boardId}/${Date.now()}-${nanoid()}.${ext}`;
      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (!error) src = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
    } catch (error) {
      console.warn("Image upload fell back to local data URL", error);
    }

    const position = point || {
      x: Math.round(window.innerWidth / 2) - camera.x - 160,
      y: Math.round(window.innerHeight / 2) - camera.y - 100,
    };

    insertImageLayer({ x: position.x, y: position.y, width: 320, height: 220, src });
    toast.success("Image added to board");
  }, [boardId, camera, insertImageLayer, access.canEdit]);

  const exportBoard = useCallback(async (format) => {
    if (!svgRef.current || exporting) return;

    setExporting(true);

    try {
      const dataUrl = await toPng(svgRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f5f5f5",
      });

      if (format === "png") {
        const a = document.createElement("a");
        a.download = `board-${boardId}.png`;
        a.href = dataUrl;
        a.click();
        toast.success("Board exported as PNG");
      } else {
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1200, 800] });
        pdf.addImage(dataUrl, "PNG", 0, 0, 1200, 800);
        pdf.save(`board-${boardId}.pdf`);
        toast.success("Board exported as PDF");
      }

      setExportOpen(false);
    } catch {
      toast.error("Export failed. Try again after images finish loading.");
    } finally {
      setExporting(false);
    }
  }, [boardId, exporting]);

  useEffect(() => {
    function onKeyDown(e) {
      const activeElement = document.activeElement;
      const isTypingInField =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !isTypingInField) {
        e.preventDefault();
        e.shiftKey ? history.redo() : history.undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && !isTypingInField) {
        e.preventDefault();
        copySelectedLayers();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v" && !isTypingInField && copiedLayersRef.current.length) {
        e.preventDefault();
        pasteCopiedLayers();
        return;
      }

      if (access.canEdit && (e.key === "Delete" || e.key === "Backspace") && !isTypingInField) {
        deleteLayers();
      }
    }

    function onPaste(e) {
      if (!access.canEdit) return;

      const activeElement = document.activeElement;
      const isTypingInField =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable;

      if (isTypingInField) return;

      const item = Array.from(e.clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
      const file = item?.getAsFile();

      if (file) {
        e.preventDefault();
        uploadImageFile(file);
        return;
      }

      const pastedText = e.clipboardData?.getData("text/plain");
      if (pastedText?.trim()) {
        e.preventDefault();
        uploadTextLayer(pastedText);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("paste", onPaste);
    };
  }, [deleteLayers, history, uploadImageFile, uploadTextLayer, copySelectedLayers, pasteCopiedLayers, access.canEdit]);

  if (!access.loading && !access.canView) {
    return (
      <main className="h-full w-full grid place-items-center bg-neutral-100">
        <div className="bg-white border shadow-md rounded-lg p-6 text-center max-w-md">
          <h1 className="text-xl font-semibold text-neutral-900">Guest access is disabled</h1>
          <p className="text-sm text-muted-foreground mt-2">Ask the board owner to enable guest view again or send you an invite.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none overflow-hidden">
      <Info boardId={boardId} />
      <Participants />

      {!access.loading && !access.canEdit && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white border shadow-md rounded-md px-3 py-2 text-sm z-50">
          View-only access
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImageFile(file);
          e.target.value = "";
        }}
      />

      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
        onImageUpload={() => {
          if (!access.canEdit) {
            toast.error("You only have view access to this board.");
            return;
          }
          fileInputRef.current?.click();
        }}
        onClearBoard={() => {
          if (!access.canEdit) {
            toast.error("You only have view access to this board.");
            return;
          }
          if (window.confirm("Clear this board for everyone?")) {
            clearBoard();
            toast.success("Board cleared");
          }
        }}
        onExport={() => setExportOpen(true)}
      />

      {exportOpen && (
        <div className="absolute inset-0 z-[80] bg-black/20 flex items-center justify-center" onPointerDown={() => !exporting && setExportOpen(false)}>
          <div className="w-[360px] rounded-2xl bg-white border shadow-xl p-5" onPointerDown={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-neutral-900">Export board</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose one file type to download.</p>

            <div className="mt-4 grid gap-3">
              <button disabled={exporting} onClick={() => exportBoard("png")} className="text-left rounded-xl border p-4 hover:bg-neutral-50 transition disabled:opacity-60">
                <div className="font-medium">PNG image</div>
                <div className="text-xs text-muted-foreground mt-1">Best for screenshots, sharing, and quick previews.</div>
              </button>
              <button disabled={exporting} onClick={() => exportBoard("pdf")} className="text-left rounded-xl border p-4 hover:bg-neutral-50 transition disabled:opacity-60">
                <div className="font-medium">PDF document</div>
                <div className="text-xs text-muted-foreground mt-1">Best for printing, report evidence, and submission.</div>
              </button>
            </div>

            <button disabled={exporting} onClick={() => setExportOpen(false)} className="mt-4 w-full h-10 rounded-lg text-sm border hover:bg-neutral-50 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      )}

      {canvasState.mode === CanvasMode.Connector && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white border shadow-md rounded-md px-3 py-2 text-sm z-50">
          {canvasState.fromId ? "Click the second object to finish the arrow." : "Click the first object to start an arrow."}
        </div>
      )}

      {canvasState.mode === CanvasMode.ConnectorEndpoint && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white border shadow-md rounded-md px-3 py-2 text-sm z-50">
          Drag the connector handle to bend, resize, or reposition it.
        </div>
      )}

      <SelectionTools camera={camera} setLastUsedColor={setLastUsedColor} />

      <svg
        ref={svgRef}
        className="h-[100vh] w-[100vw] touch-none"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g style={{ transform: `translate(${camera.x}px, ${camera.y}px)` }}>
          {layerIds.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              onConnectorHandlePointerDown={onConnectorHandlePointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}

          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />

          {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
            <rect
              className="fill-blue-500/5 stroke-blue-500 stroke-1"
              x={Math.min(canvasState.origin.x, canvasState.current.x)}
              y={Math.min(canvasState.origin.y, canvasState.current.y)}
              width={Math.abs(canvasState.origin.x - canvasState.current.x)}
              height={Math.abs(canvasState.origin.y - canvasState.current.y)}
            />
          )}

          <CursorsPresence />

          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={canvasState.mode === CanvasMode.Highlighter ? "#facc15" : colorToCss(lastUsedColor)}
              x={0}
              y={0}
              strokeSize={canvasState.mode === CanvasMode.Highlighter ? 28 : 16}
              opacity={canvasState.mode === CanvasMode.Highlighter ? 0.35 : 1}
              isHighlighter={canvasState.mode === CanvasMode.Highlighter}
            />
          )}
        </g>
      </svg>
    </main>
  );
};
