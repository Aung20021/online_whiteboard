export var LayerType;
(function (LayerType) {
  LayerType[(LayerType.Rectangle = 0)] = "Rectangle";
  LayerType[(LayerType.Ellipse = 1)] = "Ellipse";
  LayerType[(LayerType.Path = 2)] = "Path";
  LayerType[(LayerType.Text = 3)] = "Text";
  LayerType[(LayerType.Note = 4)] = "Note";
  LayerType[(LayerType.Image = 5)] = "Image";
  LayerType[(LayerType.Connector = 6)] = "Connector";
  LayerType[(LayerType.RoundedRectangle = 7)] = "RoundedRectangle";
  LayerType[(LayerType.Triangle = 8)] = "Triangle";
  LayerType[(LayerType.Diamond = 9)] = "Diamond";
  LayerType[(LayerType.Parallelogram = 10)] = "Parallelogram";
  LayerType[(LayerType.Trapezoid = 11)] = "Trapezoid";
  LayerType[(LayerType.Hexagon = 12)] = "Hexagon";
  LayerType[(LayerType.Star = 13)] = "Star";
  LayerType[(LayerType.Cloud = 14)] = "Cloud";
  LayerType[(LayerType.Pentagon = 15)] = "Pentagon";
  LayerType[(LayerType.Cylinder = 16)] = "Cylinder";
  LayerType[(LayerType.Document = 17)] = "Document";
  LayerType[(LayerType.SpeechBubble = 18)] = "SpeechBubble";
  LayerType[(LayerType.BlockArrow = 19)] = "BlockArrow";
  LayerType[(LayerType.Line = 20)] = "Line";
})(LayerType || (LayerType = {}));

export var Side;
(function (Side) {
  Side[(Side.Top = 1)] = "Top";
  Side[(Side.Bottom = 2)] = "Bottom";
  Side[(Side.Left = 4)] = "Left";
  Side[(Side.Right = 8)] = "Right";
})(Side || (Side = {}));

export var CanvasMode;
(function (CanvasMode) {
  CanvasMode[(CanvasMode.None = 0)] = "None";
  CanvasMode[(CanvasMode.Pressing = 1)] = "Pressing";
  CanvasMode[(CanvasMode.SelectionNet = 2)] = "SelectionNet";
  CanvasMode[(CanvasMode.Translating = 3)] = "Translating";
  CanvasMode[(CanvasMode.Inserting = 4)] = "Inserting";
  CanvasMode[(CanvasMode.Resizing = 5)] = "Resizing";
  CanvasMode[(CanvasMode.Pencil = 6)] = "Pencil";
  CanvasMode[(CanvasMode.Highlighter = 7)] = "Highlighter";
  CanvasMode[(CanvasMode.Connector = 8)] = "Connector";
  CanvasMode[(CanvasMode.ConnectorEndpoint = 9)] = "ConnectorEndpoint";
})(CanvasMode || (CanvasMode = {}));

export const ShapeLayerTypes = [
  LayerType.Rectangle,
  LayerType.RoundedRectangle,
  LayerType.Ellipse,
  LayerType.Triangle,
  LayerType.Diamond,
  LayerType.Parallelogram,
  LayerType.Trapezoid,
  LayerType.Hexagon,
  LayerType.Pentagon,
  LayerType.Star,
  LayerType.Cloud,
  LayerType.Cylinder,
  LayerType.Document,
  LayerType.SpeechBubble,
  LayerType.BlockArrow,
  LayerType.Line,
];

export const ConnectorTypes = {
  Straight: "straight",
  Elbow: "elbow",
  Curved: "curved",
  Freeform: "freeform",
};

export const ArrowTypes = {
  None: "none",
  Arrow: "arrow",
  Dot: "dot",
};
