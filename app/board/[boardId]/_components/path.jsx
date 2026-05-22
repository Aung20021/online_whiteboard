import getStroke from "perfect-freehand";
import { getSvgPathFromStroke } from "@/lib/utils";

export const Path = ({ x, y, points, fill, onPointerDown, stroke, strokeSize = 16, opacity = 1, isHighlighter = false }) => (
  <path
    className={isHighlighter ? "mix-blend-multiply" : "drop-shadow-md"}
    onPointerDown={onPointerDown}
    d={getSvgPathFromStroke(getStroke(points, { size: strokeSize, thinning: isHighlighter ? 0.15 : 0.5, smoothing: 0.5, streamline: 0.5 }))}
    style={{ transform: `translate(${x}px, ${y}px)`, opacity }}
    x={0}
    y={0}
    fill={fill}
    stroke={stroke}
    strokeWidth={1}
  />
);
