"use client";

import { memo, useMemo } from "react";
import { BringToFront, Minus, Plus, SendToBack, Trash2 } from "lucide-react";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { useMutation, useSelf, useStorage } from "@/liveblocks.config";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { ArrowTypes, ConnectorTypes, LayerType } from "@/types/canvas";
import { ColorPicker } from "./color-picker";

function pointBetween(a, b, ratio = 0.5) {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
  };
}

function SmallSelect({ value, onChange, children }) {
  return (
    <select
      className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 outline-none"
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
  );
}

function SmallNumber({ label, value, onChange, min, max }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 h-9 text-xs text-neutral-600 whitespace-nowrap">
      <span>{label}</span>
      <input
        className="w-12 bg-transparent outline-none"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export const SelectionTools = memo(({ camera, setLastUsedColor }) => {
  const selection = useSelf((me) => me.presence.selection || []);
  const firstSelectedId = selection?.[0];
  const selectedLayer = useStorage((root) => (firstSelectedId ? root.layers.get(firstSelectedId) : null));
  const isSingleConnector = selection?.length === 1 && selectedLayer?.type === LayerType.Connector;
  const selectionBounds = useSelectionBounds();
  const deleteLayers = useDeleteLayers();

  const moveToFront = useMutation(({ storage }) => {
    const liveLayerIds = storage.get("layerIds");
    const indices = [];
    const arr = liveLayerIds.toImmutable();

    for (let i = 0; i < arr.length; i++) {
      if (selection.includes(arr[i])) indices.push(i);
    }

    for (let i = indices.length - 1; i >= 0; i--) {
      liveLayerIds.move(indices[i], arr.length - 1 - (indices.length - 1 - i));
    }
  }, [selection]);

  const moveToBack = useMutation(({ storage }) => {
    const liveLayerIds = storage.get("layerIds");
    const indices = [];
    const arr = liveLayerIds.toImmutable();

    for (let i = 0; i < arr.length; i++) {
      if (selection.includes(arr[i])) indices.push(i);
    }

    for (let i = 0; i < indices.length; i++) {
      liveLayerIds.move(indices[i], i);
    }
  }, [selection]);

  const setFill = useMutation(({ storage }, fill) => {
    const liveLayers = storage.get("layers");
    setLastUsedColor(fill);

    selection.forEach((id) => {
      const layer = liveLayers.get(id);
      if (!layer) return;

      if (layer.get("type") === LayerType.Connector || layer.get("type") === LayerType.Line) {
        layer.set("stroke", fill);
      } else {
        layer.set("fill", fill);
      }
    });
  }, [selection, setLastUsedColor]);

  const updateConnector = useMutation(({ storage }, updates) => {
    if (!firstSelectedId) return;
    const layer = storage.get("layers").get(firstSelectedId);
    if (!layer || layer.get("type") !== LayerType.Connector) return;
    layer.update(updates);
  }, [firstSelectedId]);

  const setConnectorType = useMutation(({ storage }, connectorType) => {
    if (!firstSelectedId) return;
    const layer = storage.get("layers").get(firstSelectedId);
    if (!layer || layer.get("type") !== LayerType.Connector) return;

    const start = { x: layer.get("x"), y: layer.get("y") };
    const end = { x: layer.get("endX"), y: layer.get("endY") };
    const existingPoints = Array.isArray(layer.get("points")) ? layer.get("points") : [];

    let points = existingPoints;

    if (connectorType === ConnectorTypes.Straight) {
      points = [];
    } else if (connectorType === ConnectorTypes.Elbow && existingPoints.length < 2) {
      const midX = start.x + (end.x - start.x) / 2;
      points = [
        { x: midX, y: start.y },
        { x: midX, y: end.y },
      ];
    } else if (connectorType === ConnectorTypes.Curved && existingPoints.length < 2) {
      points = [
        { x: start.x + Math.abs(end.x - start.x) * 0.45, y: start.y },
        { x: end.x - Math.abs(end.x - start.x) * 0.45, y: end.y },
      ];
    } else if (connectorType === ConnectorTypes.Freeform && existingPoints.length < 1) {
      points = [pointBetween(start, end)];
    }

    layer.update({ connectorType, points });
  }, [firstSelectedId]);

  const addConnectorPoint = useMutation(({ storage }) => {
    if (!firstSelectedId) return;
    const layer = storage.get("layers").get(firstSelectedId);
    if (!layer || layer.get("type") !== LayerType.Connector) return;

    const points = Array.isArray(layer.get("points")) ? [...layer.get("points")] : [];
    const start = { x: layer.get("x"), y: layer.get("y") };
    const end = { x: layer.get("endX"), y: layer.get("endY") };

    if (!points.length) {
      points.push(pointBetween(start, end));
    } else {
      const lastPoint = points[points.length - 1];
      points.push(pointBetween(lastPoint, end));
    }

    layer.update({ points, connectorType: ConnectorTypes.Freeform });
  }, [firstSelectedId]);

  const removeConnectorPoint = useMutation(({ storage }) => {
    if (!firstSelectedId) return;
    const layer = storage.get("layers").get(firstSelectedId);
    if (!layer || layer.get("type") !== LayerType.Connector) return;

    const points = Array.isArray(layer.get("points")) ? [...layer.get("points")] : [];
    points.pop();
    layer.update({ points });
  }, [firstSelectedId]);

  const connectorValues = useMemo(() => ({
    connectorType: selectedLayer?.connectorType || ConnectorTypes.Straight,
    arrowStart: selectedLayer?.arrowStart || ArrowTypes.None,
    arrowEnd: selectedLayer?.arrowEnd || ArrowTypes.Arrow,
    arrowSize: selectedLayer?.arrowSize || 12,
    strokeWidth: selectedLayer?.strokeWidth || 2,
    lineDash: selectedLayer?.lineDash || "solid",
    points: Array.isArray(selectedLayer?.points) ? selectedLayer.points : [],
  }), [selectedLayer]);

  if (!selectionBounds) return null;

  const x = selectionBounds.width / 2 + selectionBounds.x + camera.x;
  const y = selectionBounds.y + camera.y;

  return (
    <div
      className="absolute z-50 max-w-[calc(100vw-110px)] overflow-x-auto rounded-2xl border border-neutral-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm flex items-center gap-3 select-none"
      style={{ transform: `translate(calc(${x}px - 50%), calc(${y - 18}px - 100%))` }}
    >
      <div className="shrink-0">
        <ColorPicker onChange={setFill} />
      </div>

      {isSingleConnector && (
        <div className="flex items-center gap-2 border-l border-neutral-200 pl-3">
          <SmallSelect value={connectorValues.connectorType} onChange={(e) => setConnectorType(e.target.value)}>
            <option value={ConnectorTypes.Straight}>Straight</option>
            <option value={ConnectorTypes.Elbow}>Elbow</option>
            <option value={ConnectorTypes.Curved}>Curved</option>
            <option value={ConnectorTypes.Freeform}>Freeform</option>
          </SmallSelect>

          <SmallSelect value={connectorValues.arrowStart} onChange={(e) => updateConnector({ arrowStart: e.target.value })}>
            <option value={ArrowTypes.None}>Start none</option>
            <option value={ArrowTypes.Arrow}>Start arrow</option>
            <option value={ArrowTypes.Dot}>Start dot</option>
          </SmallSelect>

          <SmallSelect value={connectorValues.arrowEnd} onChange={(e) => updateConnector({ arrowEnd: e.target.value })}>
            <option value={ArrowTypes.None}>End none</option>
            <option value={ArrowTypes.Arrow}>End arrow</option>
            <option value={ArrowTypes.Dot}>End dot</option>
          </SmallSelect>

          <SmallSelect value={connectorValues.lineDash} onChange={(e) => updateConnector({ lineDash: e.target.value })}>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </SmallSelect>

          <SmallNumber label="Arrow" value={connectorValues.arrowSize} min="6" max="48" onChange={(e) => updateConnector({ arrowSize: Number(e.target.value) || 12 })} />
          <SmallNumber label="Line" value={connectorValues.strokeWidth} min="1" max="16" onChange={(e) => updateConnector({ strokeWidth: Number(e.target.value) || 2 })} />

          <Hint label="Add bend point">
            <Button variant="board" size="icon" className="rounded-xl border border-neutral-200 bg-white" onClick={addConnectorPoint}>
              <Plus className="h-4 w-4" />
            </Button>
          </Hint>

          <Hint label="Remove last bend point">
            <Button variant="board" size="icon" className="rounded-xl border border-neutral-200 bg-white" onClick={removeConnectorPoint} disabled={!connectorValues.points.length}>
              <Minus className="h-4 w-4" />
            </Button>
          </Hint>
        </div>
      )}

      <div className="flex items-center gap-1 border-l border-neutral-200 pl-3">
        <Hint label="Bring to front">
          <Button variant="board" size="icon" className="rounded-xl border border-neutral-200 bg-white" onClick={moveToFront}>
            <BringToFront className="h-4 w-4" />
          </Button>
        </Hint>
        <Hint label="Send to back">
          <Button variant="board" size="icon" className="rounded-xl border border-neutral-200 bg-white" onClick={moveToBack}>
            <SendToBack className="h-4 w-4" />
          </Button>
        </Hint>
      </div>

      <div className="flex items-center border-l border-neutral-200 pl-3">
        <Hint label="Delete">
          <Button variant="board" size="icon" className="rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={deleteLayers}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </Hint>
      </div>
    </div>
  );
});
SelectionTools.displayName = "SelectionTools";
