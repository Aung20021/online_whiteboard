import { colorToCss } from "@/lib/utils";
import { LayerType } from "@/types/canvas";

function polygonPoints(points) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function starPoints(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.min(width, height) / 2;
  const inner = outer * 0.45;
  const points = [];

  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }

  return polygonPoints(points);
}

function cloudPath(width, height) {
  return `M ${width * 0.24} ${height * 0.72} C ${width * 0.08} ${height * 0.72}, ${width * 0.06} ${height * 0.45}, ${width * 0.24} ${height * 0.43} C ${width * 0.26} ${height * 0.25}, ${width * 0.47} ${height * 0.18}, ${width * 0.58} ${height * 0.32} C ${width * 0.72} ${height * 0.22}, ${width * 0.9} ${height * 0.35}, ${width * 0.84} ${height * 0.54} C ${width * 0.98} ${height * 0.6}, ${width * 0.9} ${height * 0.82}, ${width * 0.74} ${height * 0.76} L ${width * 0.24} ${height * 0.72} Z`;
}

function documentPath(width, height) {
  return `M 0 0 H ${width} V ${height * 0.82} C ${width * 0.75} ${height * 0.98}, ${width * 0.48} ${height * 0.66}, 0 ${height * 0.9} Z`;
}

function speechBubblePath(width, height) {
  const tailX = width * 0.25;
  return `M ${width * 0.08} 0 H ${width * 0.92} Q ${width} 0 ${width} ${height * 0.08} V ${height * 0.72} Q ${width} ${height * 0.8} ${width * 0.92} ${height * 0.8} H ${width * 0.38} L ${tailX} ${height} L ${tailX * 1.08} ${height * 0.8} H ${width * 0.08} Q 0 ${height * 0.8} 0 ${height * 0.72} V ${height * 0.08} Q 0 0 ${width * 0.08} 0 Z`;
}

function arrowPath(width, height) {
  return polygonPoints([
    [0, height * 0.28],
    [width * 0.62, height * 0.28],
    [width * 0.62, 0],
    [width, height / 2],
    [width * 0.62, height],
    [width * 0.62, height * 0.72],
    [0, height * 0.72],
  ]);
}

export const Shape = ({ id, layer, onPointerDown, selectionColor }) => {
  const { x, y, width, height, fill, type } = layer;
  const fillColor = fill ? colorToCss(fill) : "#ffffff";
  const stroke = selectionColor || "#d1d5db";

  const common = {
    className: "drop-shadow-md",
    onPointerDown: (e) => onPointerDown(e, id),
    strokeWidth: selectionColor ? 2 : 1,
    fill: fillColor,
    stroke,
  };

  if (type === LayerType.Line) {
    return (
      <g>
        <line
          x1={x}
          y1={y}
          x2={layer.endX ?? x + width}
          y2={layer.endY ?? y}
          stroke={stroke}
          strokeWidth={selectionColor ? 3 : 2}
          strokeLinecap="round"
          onPointerDown={(e) => onPointerDown(e, id)}
        />
        <line
          x1={x}
          y1={y}
          x2={layer.endX ?? x + width}
          y2={layer.endY ?? y}
          stroke="transparent"
          strokeWidth={18}
          strokeLinecap="round"
          onPointerDown={(e) => onPointerDown(e, id)}
        />
      </g>
    );
  }

  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }}>
      {type === LayerType.Rectangle && <rect {...common} x={0} y={0} width={width} height={height} />}
      {type === LayerType.RoundedRectangle && <rect {...common} x={0} y={0} width={width} height={height} rx={18} ry={18} />}
      {type === LayerType.Ellipse && <ellipse {...common} cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} />}
      {type === LayerType.Triangle && <polygon {...common} points={polygonPoints([[width / 2, 0], [width, height], [0, height]])} />}
      {type === LayerType.Diamond && <polygon {...common} points={polygonPoints([[width / 2, 0], [width, height / 2], [width / 2, height], [0, height / 2]])} />}
      {type === LayerType.Parallelogram && <polygon {...common} points={polygonPoints([[width * 0.25, 0], [width, 0], [width * 0.75, height], [0, height]])} />}
      {type === LayerType.Trapezoid && <polygon {...common} points={polygonPoints([[width * 0.2, 0], [width * 0.8, 0], [width, height], [0, height]])} />}
      {type === LayerType.Hexagon && <polygon {...common} points={polygonPoints([[width * 0.25, 0], [width * 0.75, 0], [width, height / 2], [width * 0.75, height], [width * 0.25, height], [0, height / 2]])} />}
      {type === LayerType.Pentagon && <polygon {...common} points={polygonPoints([[width / 2, 0], [width, height * 0.38], [width * 0.82, height], [width * 0.18, height], [0, height * 0.38]])} />}
      {type === LayerType.Star && <polygon {...common} points={starPoints(width, height)} />}
      {type === LayerType.Cloud && <path {...common} d={cloudPath(width, height)} />}
      {type === LayerType.Cylinder && (
        <g onPointerDown={(e) => onPointerDown(e, id)}>
          <path {...common} d={`M 0 ${height * 0.16} C 0 0 ${width} 0 ${width} ${height * 0.16} V ${height * 0.84} C ${width} ${height} 0 ${height} 0 ${height * 0.84} Z`} />
          <ellipse cx={width / 2} cy={height * 0.16} rx={width / 2} ry={height * 0.16} fill="none" stroke={stroke} strokeWidth={selectionColor ? 2 : 1} />
        </g>
      )}
      {type === LayerType.Document && <path {...common} d={documentPath(width, height)} />}
      {type === LayerType.SpeechBubble && <path {...common} d={speechBubblePath(width, height)} />}
      {type === LayerType.BlockArrow && <polygon {...common} points={arrowPath(width, height)} />}
    </g>
  );
};
