export const ImageLayer = ({ id, layer, onPointerDown, selectionColor }) => {
  const { x, y, width, height, src } = layer;
  return (
    <g onPointerDown={(e) => onPointerDown(e, id)}>
      <image href={src} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" className="drop-shadow-md" />
      <rect x={x} y={y} width={width} height={height} fill="transparent" stroke={selectionColor || "transparent"} strokeWidth={1} />
    </g>
  );
};
