
import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Group,
  Rect,
  Text,
  Transformer,
} from "react-konva";
import { jsPDF } from "jspdf";
import type Konva from "konva";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const FONT_OPTIONS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
];

export default function EditorPage() {
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);

  const [studentName, setStudentName] = useState("Student Name");
  const [fontFamily, setFontFamily] = useState("Georgia");
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState("#25213d");
  const [boxWidth, setBoxWidth] = useState(480);
  const [boxHeight, setBoxHeight] = useState(100);
  const [boxPosition, setBoxPosition] = useState({ x: 210, y: 240 });

  const stageRef = useRef<Konva.Stage>(null);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundFit, setBackgroundFit] = useState<
  "fit" | "fill" | "stretch"
>("stretch");

  useEffect(() => {
    if (!backgroundUrl) {
      setBackgroundImage(null);
      return;
    }

    const image = new window.Image();
    image.onload = () => setBackgroundImage(image);
    image.onerror = () => {
      setBackgroundImage(null);
      setBackgroundUrl("");
      window.alert("Could not load this image. Please choose another file.");
    };
    image.src = backgroundUrl;
  }, [backgroundUrl]);

  useEffect(() => {
    const group = groupRef.current;
    const transformer = transformerRef.current;

    if (group && transformer) {
      transformer.nodes([group]);
      transformer.getLayer()?.batchDraw();
    }
  }, [backgroundUrl]);

  function handleBackgroundUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      window.alert("Please choose a PNG or JPG/JPEG image.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleTransformEnd() {
    const group = groupRef.current;
    if (!group) return;

    const scaleX = group.scaleX();
    const scaleY = group.scaleY();

    setBoxPosition({ x: group.x(), y: group.y() });
    setBoxWidth(Math.max(100, Math.round(group.width() * scaleX)));
    setBoxHeight(Math.max(45, Math.round(group.height() * scaleY)));

    group.scaleX(1);
    group.scaleY(1);
  }

  
    function exportPng() {
    const stage = stageRef.current;
    const group = groupRef.current;
    const transformer = transformerRef.current;

    if (!stage || !backgroundImage || !group) return;

    const outline = group.children[0];

    outline.hide();
    transformer?.hide();
    stage.batchDraw();

    try {
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        const link = document.createElement("a");
        link.download = "certificate-design.png";
        link.href = dataUrl;
        link.click();
    } finally {
        outline.show();
        transformer?.show();
        stage.batchDraw();
    }
    }

    function exportPdf() {
        const stage = stageRef.current;
        const group = groupRef.current;
        const transformer = transformerRef.current;

        if (!stage || !backgroundImage || !group) {
            window.alert("Please upload a certificate background first.");
            return;
        }

        const outline = group.children[0];

        outline.hide();
        transformer?.hide();
        stage.batchDraw();

        try {
            const dataUrl = stage.toDataURL({ pixelRatio: 2 });

            const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [CANVAS_WIDTH, CANVAS_HEIGHT],
            hotfixes: ["px_scaling"],
            });

            pdf.addImage(
            dataUrl,
            "PNG",
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            );

            pdf.save("certificate-design.pdf");
        } catch (error) {
            console.error("PDF export failed:", error);
            window.alert("Could not export the PDF. Please try again.");
        } finally {
            outline.show();
            transformer?.show();
            stage.batchDraw();
        }
    }


  function resetTextPosition() {
    setBoxPosition({ x: 210, y: 240 });
    setBoxWidth(480);
    setBoxHeight(100);
  }

  const backgroundLayout = (() => {
        if (!backgroundImage) {
            return {
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            };
        }

        const imageWidth = backgroundImage.naturalWidth;
        const imageHeight = backgroundImage.naturalHeight;

        if (backgroundFit === "stretch") {
            return {
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            };
        }

        const scaleX = CANVAS_WIDTH / imageWidth;
        const scaleY = CANVAS_HEIGHT / imageHeight;

        const scale =
            backgroundFit === "fit"
            ? Math.min(scaleX, scaleY)
            : Math.max(scaleX, scaleY);

        const width = imageWidth * scale;
        const height = imageHeight * scale;

        return {
            x: (CANVAS_WIDTH - width) / 2,
            y: (CANVAS_HEIGHT - height) / 2,
            width,
            height,
        };
        })();

  return (
    <div className="editor-page">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">DESIGN WORKSPACE</span>
          <h1>Certificate Editor</h1>
          <p>Upload a design, customize the name, and position it on your certificate.</p>
        </div>

        <div className="export-actions">
            <button
                className="secondary-button"
                onClick={exportPng}
                disabled={!backgroundImage}
                type="button"
            >
                Download PNG ↓
            </button>

            <button
                className="primary-button"
                onClick={exportPdf}
                disabled={!backgroundImage}
                type="button"
            >
                Download PDF ↓
            </button>
            </div>
      </div>

      <div className="editor-layout">
        <aside className="editor-sidebar">
          <section className="editor-panel">
            <h2>1. Background</h2>
            <p className="panel-description">
              Choose your certificate template.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={handleBackgroundUpload}
            />

            <button
              type="button"
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="upload-symbol">↑</span>
              <span>
                <strong>Upload background</strong>
                <small>PNG, JPG or JPEG</small>
              </span>
            </button>

            <div className="background-fit-control">
                <label className="field-label" htmlFor="background-fit">
                    Background fitting
                </label>

                <select
                    id="background-fit"
                    className="editor-input"
                    value={backgroundFit}
                    onChange={(event) =>
                    setBackgroundFit(
                        event.target.value as "fit" | "fill" | "stretch"
                    )
                    }
                >
                    <option value="fit">Fit — show the entire image</option>
                    <option value="fill">Fill — cover the entire canvas</option>
                    <option value="stretch">Stretch — fill without preserving proportions</option>
                </select>

                <p className="field-hint">
                    Choose how your certificate background fits the canvas.
                </p>
            </div>

            {backgroundImage && (
              <p className="success-message">Background loaded successfully.</p>
            )}
          </section>

          <section className="editor-panel">
            <h2>2. Recipient name</h2>
            <label className="field-label" htmlFor="student-name">
              Name on certificate
            </label>
            <textarea
              id="student-name"
              className="editor-input editor-textarea"
              rows={3}
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Enter recipient name"
            />
            <p className="field-hint">
              Use a new line when you want to split a long name manually.
            </p>
          </section>

          <section className="editor-panel">
            <h2>3. Text appearance</h2>

            <label className="field-label" htmlFor="font-family">
              Font family
            </label>
            <select
              id="font-family"
              className="editor-input"
              value={fontFamily}
              onChange={(event) => setFontFamily(event.target.value)}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>

            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="font-size">
                  Font size
                </label>
                <input
                  id="font-size"
                  className="editor-input"
                  type="number"
                  min={8}
                  max={120}
                  value={fontSize}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (value >= 8 && value <= 120) setFontSize(value);
                  }}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="font-color">
                  Text color
                </label>
                <input
                  id="font-color"
                  className="color-input"
                  type="color"
                  value={fontColor}
                  onChange={(event) => setFontColor(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="editor-panel">
            <h2>4. Text box</h2>
            <p className="panel-description">
              Drag the text on the canvas. Use the corner handles to resize its box.
            </p>

            <label className="field-label" htmlFor="box-width">
              Width: {boxWidth}px
            </label>
            <input
              id="box-width"
              className="range-input"
              type="range"
              min={100}
              max={850}
              value={boxWidth}
              onChange={(event) => setBoxWidth(Number(event.target.value))}
            />

            <label className="field-label" htmlFor="box-height">
              Height: {boxHeight}px
            </label>
            <input
              id="box-height"
              className="range-input"
              type="range"
              min={45}
              max={400}
              value={boxHeight}
              onChange={(event) => setBoxHeight(Number(event.target.value))}
            />

            <button
              type="button"
              className="reset-button"
              onClick={resetTextPosition}
            >
              Reset text box position and size
            </button>
          </section>
        </aside>

        <section className="canvas-workspace">
          <div className="canvas-toolbar">
            <div>
              <strong>Live preview</strong>
              <span>900 × 600 design canvas</span>
            </div>
            <span className="canvas-zoom">100%</span>
          </div>

          <div className="canvas-scroll-area">
            <div className="canvas-frame">
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="certificate-stage"
              >
                <Layer>
                  {backgroundImage && (
                    <KonvaImage
                        image={backgroundImage}
                        x={backgroundLayout.x}
                        y={backgroundLayout.y}
                        width={backgroundLayout.width}
                        height={backgroundLayout.height}
                        listening={false}
                    />
                  )}

                  {!backgroundImage && (
                    <>
                      <Rect
                        x={0}
                        y={0}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        fill="#ffffff"
                      />
                      <Text
                        x={100}
                        y={250}
                        width={700}
                        text="Upload a certificate background to begin"
                        fontFamily="Arial"
                        fontSize={23}
                        fill="#8a8da0"
                        align="center"
                      />
                    </>
                  )}

                  <Group
                    ref={groupRef}
                    x={boxPosition.x}
                    y={boxPosition.y}
                    width={boxWidth}
                    height={boxHeight}
                    draggable
                    onDragEnd={(event) => {
                      setBoxPosition({
                        x: event.target.x(),
                        y: event.target.y(),
                      });
                    }}
                    onTransformEnd={handleTransformEnd}
                  >
                    <Rect
                      width={boxWidth}
                      height={boxHeight}
                      fill="#ffffff"
                      opacity={0.02}
                      stroke="#6555e9"
                      strokeWidth={1}
                      dash={[5, 4]}
                    />
                    <Text
                      text={studentName}
                      width={boxWidth}
                      height={boxHeight}
                      fontFamily={fontFamily}
                      fontSize={fontSize}
                      fill={fontColor}
                      align="center"
                      verticalAlign="middle"
                      wrap="word"
                      padding={5}
                      listening={false}
                    />
                  </Group>

                  <Transformer
                    ref={transformerRef}
                    rotateEnabled={false}
                    keepRatio={false}
                    enabledAnchors={[
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                      "middle-left",
                      "middle-right",
                      "top-center",
                      "bottom-center",
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 100 || newBox.height < 45) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>
            </div>
          </div>

          <div className="canvas-tip">
            <span>ⓘ</span>
            The dashed outline is the editable text box. It is not part of the exported image.
          </div>
        </section>
      </div>
    </div>
  );
}
