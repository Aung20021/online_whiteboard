"use client";

import { memo } from "react";
import { colorToCss } from "@/lib/utils";
import { LayerType, ShapeLayerTypes } from "@/types/canvas";
import { useSelf, useStorage } from "@/liveblocks.config";
import { Text } from "./text";
import { Note } from "./note";
import { Path } from "./path";
import { ImageLayer } from "./image-layer";
import { Connector } from "./connector";
import { Shape } from "./shape";

export const LayerPreview = memo(({ id, onLayerPointerDown, onConnectorHandlePointerDown, selectionColor }) => {
  const layer = useStorage((root) => root.layers.get(id));
  const selfSelection = useSelf((me) => me.presence.selection || []);
  const isSelected = selfSelection.includes(id);

  if (!layer) return null;

  if (ShapeLayerTypes.includes(layer.type)) {
    return <Shape id={id} layer={layer} onPointerDown={onLayerPointerDown} selectionColor={selectionColor || (isSelected ? "#2563eb" : undefined)} />;
  }

  switch (layer.type) {
    case LayerType.Path:
      return (
        <Path
          key={id}
          points={layer.points}
          onPointerDown={(e) => onLayerPointerDown(e, id)}
          x={layer.x}
          y={layer.y}
          fill={layer.fill ? colorToCss(layer.fill) : "#000"}
          stroke={selectionColor || (isSelected ? "#2563eb" : undefined)}
          strokeSize={layer.strokeSize || 16}
          opacity={layer.opacity ?? 1}
          isHighlighter={layer.isHighlighter}
        />
      );
    case LayerType.Note:
      return <Note id={id} layer={layer} onPointerDown={onLayerPointerDown} selectionColor={selectionColor || (isSelected ? "#2563eb" : undefined)} />;
    case LayerType.Text:
      return <Text id={id} layer={layer} onPointerDown={onLayerPointerDown} selectionColor={selectionColor || (isSelected ? "#2563eb" : undefined)} />;
    case LayerType.Image:
      return <ImageLayer id={id} layer={layer} onPointerDown={onLayerPointerDown} selectionColor={selectionColor || (isSelected ? "#2563eb" : undefined)} />;
    case LayerType.Connector:
      return (
        <Connector
          id={id}
          layer={layer}
          onPointerDown={onLayerPointerDown}
          onHandlePointerDown={onConnectorHandlePointerDown}
          selectionColor={selectionColor}
          isSelected={isSelected}
        />
      );
    default:
      return null;
  }
});
LayerPreview.displayName = "LayerPreview";
