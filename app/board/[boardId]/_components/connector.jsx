import { useMemo } from "react";
import { useStorage } from "@/liveblocks.config";
import { ArrowTypes, ConnectorTypes } from "@/types/canvas";
import { colorToCss, getLayerCenter } from "@/lib/utils";

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function normalizePoints(points) {
  return Array.isArray(points)
    ? points.filter((point) => typeof point?.x === "number" && typeof point?.y === "number")
    : [];
}

function getDefaultElbowPoints(start, end) {
  const midX = start.x + (end.x - start.x) / 2;
  return [
    { x: midX, y: start.y },
    { x: midX, y: end.y },
  ];
}

function getPath(start, end, points, connectorType) {
  const cleanPoints = normalizePoints(points);

  if (connectorType === ConnectorTypes.Elbow) {
    const elbowPoints = cleanPoints.length ? cleanPoints : getDefaultElbowPoints(start, end);
    return [start, ...elbowPoints, end]
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }

  if (connectorType === ConnectorTypes.Curved) {
    const [controlA, controlB] = cleanPoints.length >= 2
      ? cleanPoints
      : [
          { x: start.x + Math.abs(end.x - start.x) * 0.45, y: start.y },
          { x: end.x - Math.abs(end.x - start.x) * 0.45, y: end.y },
        ];

    return `M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`;
  }

  if (connectorType === ConnectorTypes.Freeform) {
    return [start, ...cleanPoints, end]
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }

  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function getVisibleHandles(start, end, points, connectorType) {
  const cleanPoints = normalizePoints(points);

  if (connectorType === ConnectorTypes.Straight) {
    return [{ kind: "virtual", index: 0, point: midpoint(start, end) }];
  }

  if (connectorType === ConnectorTypes.Elbow) {
    const handles = cleanPoints.length ? cleanPoints : getDefaultElbowPoints(start, end);
    return handles.map((point, index) => ({ kind: cleanPoints.length ? "point" : "virtual", index, point }));
  }

  if (connectorType === ConnectorTypes.Curved) {
    const handles = cleanPoints.length >= 2
      ? cleanPoints
      : [
          { x: start.x + Math.abs(end.x - start.x) * 0.45, y: start.y },
          { x: end.x - Math.abs(end.x - start.x) * 0.45, y: end.y },
        ];
    return handles.map((point, index) => ({ kind: cleanPoints.length >= 2 ? "point" : "virtual", index, point }));
  }

  if (!cleanPoints.length) {
    return [{ kind: "virtual", index: 0, point: midpoint(start, end) }];
  }

  return cleanPoints.map((point, index) => ({ kind: "point", index, point }));
}

export function getConnectorPathForExport(start, end, points, connectorType) {
  return getPath(start, end, points, connectorType);
}

export const Connector = ({
  id,
  layer,
  onPointerDown,
  onHandlePointerDown,
  selectionColor,
  isSelected,
}) => {
  const fromLayer = useStorage((root) => (layer.fromId ? root.layers.get(layer.fromId) : null));
  const toLayer = useStorage((root) => (layer.toId ? root.layers.get(layer.toId) : null));

  const start = fromLayer ? getLayerCenter(fromLayer) : { x: layer.x, y: layer.y };
  const end = toLayer ? getLayerCenter(toLayer) : { x: layer.endX, y: layer.endY };
  const points = normalizePoints(layer.points);
  const connectorType = layer.connectorType || ConnectorTypes.Straight;
  const stroke = selectionColor || colorToCss(layer.stroke || { r: 31, g: 41, b: 55 });
  const strokeWidth = layer.strokeWidth || 2;
  const arrowSize = layer.arrowSize || 12;
  const arrowStart = layer.arrowStart || ArrowTypes.None;
  const arrowEnd = layer.arrowEnd || ArrowTypes.Arrow;
  const lineDash = layer.lineDash || "solid";

  const path = useMemo(
    () => getPath(start, end, points, connectorType),
    [start.x, start.y, end.x, end.y, JSON.stringify(points), connectorType]
  );

  const handles = useMemo(
    () => getVisibleHandles(start, end, points, connectorType),
    [start.x, start.y, end.x, end.y, JSON.stringify(points), connectorType]
  );

  const markerStartId = `connector-start-${id}`;
  const markerEndId = `connector-end-${id}`;
  const selectedStroke = isSelected ? "#2563eb" : selectionColor;

  const marker = (type, direction = "end") => {
    if (type === ArrowTypes.None) return null;

    const markerId = direction === "start" ? markerStartId : markerEndId;

    if (type === ArrowTypes.Dot) {
      return (
        <marker id={markerId} markerWidth={arrowSize} markerHeight={arrowSize} refX={arrowSize / 2} refY={arrowSize / 2} orient="auto" markerUnits="userSpaceOnUse">
          <circle cx={arrowSize / 2} cy={arrowSize / 2} r={arrowSize / 3} fill={stroke} />
        </marker>
      );
    }

    return (
      <marker id={markerId} markerWidth={arrowSize} markerHeight={arrowSize} refX={direction === "start" ? 2 : arrowSize - 2} refY={arrowSize / 2} orient="auto" markerUnits="userSpaceOnUse">
        <path d={direction === "start" ? `M ${arrowSize} 1 L 1 ${arrowSize / 2} L ${arrowSize} ${arrowSize - 1} z` : `M 1 1 L ${arrowSize - 1} ${arrowSize / 2} L 1 ${arrowSize - 1} z`} fill={stroke} />
      </marker>
    );
  };

  return (
    <g className="cursor-pointer">
      <defs>
        {marker(arrowStart, "start")}
        {marker(arrowEnd, "end")}
      </defs>

      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke="#93c5fd"
          strokeWidth={Math.max(10, strokeWidth + 8)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
          pointerEvents="none"
        />
      )}

      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={selectionColor ? strokeWidth + 1 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={lineDash === "dashed" ? "10 8" : lineDash === "dotted" ? "2 7" : undefined}
        markerStart={arrowStart !== ArrowTypes.None ? `url(#${markerStartId})` : undefined}
        markerEnd={arrowEnd !== ArrowTypes.None ? `url(#${markerEndId})` : undefined}
      />

      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(24, strokeWidth + 18)}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPointerDown={(e) => onPointerDown(e, id)}
      />

      {isSelected && (
        <g>
          <circle cx={start.x} cy={start.y} r={7} className="fill-white stroke-blue-600 stroke-2 cursor-crosshair" onPointerDown={(e) => onHandlePointerDown?.(e, id, "start")} />
          <circle cx={end.x} cy={end.y} r={7} className="fill-white stroke-blue-600 stroke-2 cursor-crosshair" onPointerDown={(e) => onHandlePointerDown?.(e, id, "end")} />

          {connectorType === ConnectorTypes.Curved && points.length >= 2 && (
            <>
              <line x1={start.x} y1={start.y} x2={points[0].x} y2={points[0].y} className="stroke-blue-300 stroke-1 stroke-dasharray-2" strokeDasharray="4 4" />
              <line x1={end.x} y1={end.y} x2={points[1].x} y2={points[1].y} className="stroke-blue-300 stroke-1" strokeDasharray="4 4" />
            </>
          )}

          {handles.map((handle) => (
            <circle
              key={`${handle.kind}-${handle.index}`}
              cx={handle.point.x}
              cy={handle.point.y}
              r={6}
              className="fill-white stroke-purple-600 stroke-2 cursor-move"
              onPointerDown={(e) => onHandlePointerDown?.(e, id, handle.kind === "virtual" ? "virtual" : "point", handle.index)}
            />
          ))}
        </g>
      )}
    </g>
  );
};
