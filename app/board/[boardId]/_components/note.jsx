import { useRef } from "react";
import { Kalam } from "next/font/google";
import ContentEditable from "react-contenteditable";
import { cn, colorToCss, getContrastingTextColor } from "@/lib/utils";
import { useMutation } from "@/liveblocks.config";

const font = Kalam({
  subsets: ["latin"],
  weight: ["400"],
});

const calculateFontSize = (width, height) => {
  const maxFontSize = 42;
  const minFontSize = 18;
  const scaleFactor = 0.13;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * 0.12;
  return Math.max(minFontSize, Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize));
};

export const Note = ({ layer, onPointerDown, id, selectionColor }) => {
  const { x, y, width, height, fill, value } = layer;
  const editableRef = useRef(null);

  const updateValue = useMutation(({ storage }, newValue) => {
    const liveLayers = storage.get("layers");
    liveLayers.get(id)?.set("value", newValue);
  }, []);

  const handleContentChange = (e) => {
    updateValue(e.target.value);
  };

  const focusEditable = (e) => {
    e.stopPropagation();

    const element = editableRef.current;
    if (!element) return;

    element.focus();

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      onDoubleClick={focusEditable}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
        backgroundColor: fill ? colorToCss(fill) : "#FDE68A",
        borderRadius: 14,
      }}
      className="shadow-md drop-shadow-xl"
    >
      <div className="h-full w-full px-4 py-4 overflow-auto">
        <ContentEditable
          innerRef={editableRef}
          html={value || "Text"}
          onChange={handleContentChange}
          className={cn(
            "h-full w-full outline-none bg-transparent text-center leading-tight break-words whitespace-pre-wrap overflow-auto flex items-center justify-center",
            font.className
          )}
          style={{
            fontSize: calculateFontSize(width, height),
            color: fill ? getContrastingTextColor(fill) : "#111827",
            minHeight: "100%",
          }}
        />
      </div>
    </foreignObject>
  );
};
