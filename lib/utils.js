import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LayerType, Side } from "@/types/canvas";

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function connectionIdToColor(connectionId) {
  return COLORS[connectionId % COLORS.length];
}

export function pointerEventToCanvasPoint(e, camera) {
  return {
    x: Math.round(e.clientX) - camera.x,
    y: Math.round(e.clientY) - camera.y,
  };
}

export function colorToCss(color) {
  if (!color) return "#000000";
  if (typeof color === "string") return color;
  return `#${color.r.toString(16).padStart(2, "0")}${color.g
    .toString(16)
    .padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}

export function resizeBounds(bounds, corner, point) {
  const result = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };

  if ((corner & Side.Left) === Side.Left) {
    result.x = Math.min(point.x, bounds.x + bounds.width);
    result.width = Math.abs(bounds.x + bounds.width - point.x);
  }

  if ((corner & Side.Right) === Side.Right) {
    result.x = Math.min(point.x, bounds.x);
    result.width = Math.abs(point.x - bounds.x);
  }

  if ((corner & Side.Top) === Side.Top) {
    result.y = Math.min(point.y, bounds.y + bounds.height);
    result.height = Math.abs(bounds.y + bounds.height - point.y);
  }

  if ((corner & Side.Bottom) === Side.Bottom) {
    result.y = Math.min(point.y, bounds.y);
    result.height = Math.abs(point.y - bounds.y);
  }

  return result;
}

export function getLayerBounds(layer) {
  if (!layer) return null;

  if (layer.type === LayerType.Connector || layer.type === LayerType.Line) {
    const points = [
      { x: layer.x ?? 0, y: layer.y ?? 0 },
      ...(Array.isArray(layer.points) ? layer.points : []),
      { x: layer.endX ?? layer.x ?? 0, y: layer.endY ?? layer.y ?? 0 },
    ];

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(...xs) - x || 1;
    const height = Math.max(...ys) - y || 1;

    return { x, y, width, height };
  }

  return {
    x: layer.x,
    y: layer.y,
    width: layer.width || 1,
    height: layer.height || 1,
  };
}

export function getLayerCenter(layer) {
  const bounds = getLayerBounds(layer);

  return bounds
    ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
    : { x: 0, y: 0 };
}

export function getLiveLayerCenter(layer) {
  if (!layer) return { x: 0, y: 0 };

  return getLayerCenter({
    type: layer.get("type"),
    x: layer.get("x"),
    y: layer.get("y"),
    width: layer.get("width"),
    height: layer.get("height"),
    endX: layer.get("endX"),
    endY: layer.get("endY"),
    points: layer.get("points"),
  });
}

export function findIntersectingLayersWithRectangle(layerIds, layers, a, b) {
  const rect = {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };

  const ids = [];

  for (const layerId of layerIds) {
    const layer = layers.get(layerId);
    if (layer == null) continue;

    const bounds = getLayerBounds(layer);
    if (!bounds) continue;

    if (
      rect.x + rect.width > bounds.x &&
      rect.x < bounds.x + bounds.width &&
      rect.y + rect.height > bounds.y &&
      rect.y < bounds.y + bounds.height
    ) {
      ids.push(layerId);
    }
  }

  return ids;
}

export function getContrastingTextColor(color) {
  const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  return luminance > 182 ? "black" : "white";
}

export function penPointsToPathLayer(points, color, options = {}) {
  if (points.length < 2) {
    throw new Error("Cannot transform points with less than 2 points");
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const point of points) {
    const [x, y] = point;
    if (left > x) left = x;
    if (top > y) top = y;
    if (right < x) right = x;
    if (bottom < y) bottom = y;
  }

  return {
    type: LayerType.Path,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    fill: color,
    points: points.map(([x, y, pressure]) => [x - left, y - top, pressure]),
    strokeSize: options.strokeSize || 16,
    opacity: options.opacity ?? 1,
    isHighlighter: Boolean(options.isHighlighter),
  };
}

export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}

export function makeGuestLink(boardId, token) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/board/${boardId}?guest=${token}`;
}
