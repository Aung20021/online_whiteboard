import { shallow } from "@liveblocks/react";
import { useStorage, useSelf } from "@/liveblocks.config";
import { getLayerBounds } from "@/lib/utils";

const boundingBox = (layers) => {
  const first = layers[0];
  if (!first) return null;
  const firstBounds = getLayerBounds(first);
  if (!firstBounds) return null;
  let left = firstBounds.x;
  let right = firstBounds.x + firstBounds.width;
  let top = firstBounds.y;
  let bottom = firstBounds.y + firstBounds.height;
  for (let i = 1; i < layers.length; i++) {
    const bounds = getLayerBounds(layers[i]);
    if (!bounds) continue;
    if (left > bounds.x) left = bounds.x;
    if (right < bounds.x + bounds.width) right = bounds.x + bounds.width;
    if (top > bounds.y) top = bounds.y;
    if (bottom < bounds.y + bounds.height) bottom = bounds.y + bounds.height;
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
};

export const useSelectionBounds = () => {
  const selection = useSelf((me) => me.presence.selection);
  return useStorage((root) => {
    const selectedLayers = selection.map((layerId) => root.layers.get(layerId)).filter(Boolean);
    return boundingBox(selectedLayers);
  }, shallow);
};
