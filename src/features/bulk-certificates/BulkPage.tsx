
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Group,
  Rect,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

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

type Student = {
  id: number;
  name: string;
};

type OutputFormat = "pdf" | "png";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !quoted
    ) {
      if (char === "\r" && text[i + 1] === "\n") i++;

      row.push(cell.trim());

      if (row.some(Boolean)) rows.push(row);

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());

  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function extractNames(rows: unknown[][]): string[] {
  if (!rows.length) return [];

  const normalize = (value: unknown) =>
    String(value ?? "").trim().toLowerCase();

  const headers = [
    "name",
    "student name",
    "recipient name",
    "full name",
  ];

  const headerIndex = rows.findIndex((row) =>
    row.some((value) => headers.includes(normalize(value))),
  );

  const nameColumn =
    headerIndex >= 0
      ? rows[headerIndex].findIndex((value) =>
          headers.includes(normalize(value)),
        )
      : 0;

  return rows
    .slice(headerIndex >= 0 ? headerIndex + 1 : 0)
    .map((row) => String(row[nameColumn] ?? "").trim())
    .filter(Boolean);
}

function safeFileName(name: string): string {
  return (
    name
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replace(/[. ]+$/g, "")
      .slice(0, 100) || "student"
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createPdf(dataUrl: string): jsPDF {
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

  return pdf;
}

export default function BulkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [nameInput, setNameInput] = useState("");

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);

  // Text appearance
  const [fontFamily, setFontFamily] = useState("Georgia");
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState("#25213d");
  const [textAlign, setTextAlign] =
    useState<"left" | "center" | "right">("center");

  // Text box position and dimensions
  // These are updated by dragging and resizing the box.
  const [textX, setTextX] = useState(150);
  const [textY, setTextY] = useState(240);
  const [textWidth, setTextWidth] = useState(600);
  const [textHeight, setTextHeight] = useState(120);

  const [selectedStudentId, setSelectedStudentId] =
    useState<number | null>(null);

  const [zipFormat, setZipFormat] =
    useState<OutputFormat>("pdf");

  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const spreadsheetRef = useRef<HTMLInputElement>(null);
  const backgroundRef = useRef<HTMLInputElement>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const groupRef = useRef<Konva.Group>(null);
  const textRef = useRef<Konva.Text>(null);
  const outlineRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const nextId = useRef(1);

  const validStudents = students.filter(
    (student) => student.name.trim() !== "",
  );

  const selectedStudent =
    validStudents.find(
      (student) => student.id === selectedStudentId,
    ) ?? validStudents[0];

  // Load certificate background
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
      setMessage("Could not load the image. Please choose another file.");
    };

    image.src = backgroundUrl;
  }, [backgroundUrl]);

  // Attach Transformer to the editable text box
  useEffect(() => {
    const group = groupRef.current;
    const transformer = transformerRef.current;

    if (group && transformer) {
      transformer.nodes([group]);
      transformer.getLayer()?.batchDraw();
    }
  }, [backgroundImage]);

  // Add student manually
  function addStudent() {
    const name = nameInput.trim();

    if (!name) {
      setMessage("Enter a student name before adding.");
      return;
    }

    const id = nextId.current++;

    setStudents((current) => [
      ...current,
      { id, name },
    ]);

    setSelectedStudentId(id);
    setNameInput("");
    setMessage("");
  }

  // Update student name
  function updateStudent(id: number, name: string) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, name } : student,
      ),
    );
  }

  // Remove student
  function removeStudent(id: number) {
    setStudents((current) =>
      current.filter((student) => student.id !== id),
    );

    if (selectedStudentId === id) {
      const remaining = validStudents.filter(
        (student) => student.id !== id,
      );

      setSelectedStudentId(remaining[0]?.id ?? null);
    }
  }

  // Import Excel or CSV
  async function handleSpreadsheetUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage("");

    try {
      let rows: unknown[][];

      if (file.name.toLowerCase().endsWith(".csv")) {
        rows = parseCsv(await file.text());
      } else if (file.name.toLowerCase().endsWith(".xlsx")) {
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.load(
          await file.arrayBuffer() as never,
        );

        const sheet = workbook.worksheets[0];

        if (!sheet) {
          throw new Error("No worksheet found.");
        }

        rows = [];

        sheet.eachRow({ includeEmpty: false }, (row) => {
          rows.push(
            Array.from(
              { length: sheet.columnCount },
              (_, index) => {
                const value = row.getCell(index + 1).value;

                if (
                  value &&
                  typeof value === "object" &&
                  "text" in value
                ) {
                  return String(value.text ?? "");
                }

                if (
                  value &&
                  typeof value === "object" &&
                  "richText" in value
                ) {
                  return value.richText
                    .map((part) => part.text)
                    .join("");
                }

                return value == null ? "" : String(value);
              },
            ),
          );
        });
      } else {
        throw new Error("Unsupported file type.");
      }

      const names = extractNames(rows);

      if (!names.length) {
        setMessage(
          "No names found. Use a Name or Student Name header, or put names in the first column.",
        );
        return;
      }

      const imported = names.map((name) => ({
        id: nextId.current++,
        name,
      }));

      setStudents((current) => [...current, ...imported]);
      setSelectedStudentId(imported[0].id);

      setMessage(`Imported ${imported.length} student name(s).`);
    } catch (error) {
      console.error("Import failed:", error);

      setMessage(
        "Could not read this file. Please use a valid .xlsx or .csv file.",
      );
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  }

  // Upload certificate background
  function handleBackgroundUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMessage("Please choose a PNG, JPG, or JPEG image.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundUrl(reader.result);
        setMessage("");
      }
    };

    reader.onerror = () => {
      setMessage("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  // Drag text box
  function handleDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    setTextX(event.target.x());
    setTextY(event.target.y());
  }

  // Resize text box
  function handleTransformEnd() {
    const group = groupRef.current;
    if (!group) return;

    const scaleX = group.scaleX();
    const scaleY = group.scaleY();

    setTextX(group.x());
    setTextY(group.y());

    setTextWidth(
      Math.max(100, Math.round(textWidth * scaleX)),
    );

    setTextHeight(
      Math.max(45, Math.round(textHeight * scaleY)),
    );

    // Reset scale so font size remains unchanged
    group.scaleX(1);
    group.scaleY(1);
  }

  // Create certificate image without editing border or handles
  function createCertificateImage(name: string): string {
    const stage = stageRef.current;
    const text = textRef.current;
    const outline = outlineRef.current;
    const transformer = transformerRef.current;

    if (!stage || !text || !backgroundImage) {
      throw new Error(
        "Upload a background and wait for the preview to load.",
      );
    }

    const previewName = selectedStudent?.name ?? "Student Name";

    text.text(name);
    outline?.hide();
    transformer?.hide();

    stage.draw();

    try {
      return stage.toDataURL({ pixelRatio: 2 });
    } finally {
      text.text(previewName);
      outline?.show();
      transformer?.show();
      stage.draw();
    }
  }

  // Download one student's certificate
  function downloadStudent(
    student: Student,
    format: OutputFormat,
  ) {
    if (!backgroundImage) {
      setMessage("Upload a certificate background first.");
      return;
    }

    if (!student.name.trim()) {
      setMessage("This student has an empty name.");
      return;
    }

    try {
      const dataUrl = createCertificateImage(student.name);

      const baseName =
        `${String(student.id).padStart(3, "0")}-${safeFileName(student.name)}`;

      if (format === "png") {
        const base64 = dataUrl.split(",")[1];

        if (!base64) {
          throw new Error("Could not create the PNG image.");
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        downloadBlob(
          new Blob([bytes], { type: "image/png" }),
          `${baseName}.png`,
        );
      } else {
        createPdf(dataUrl).save(`${baseName}.pdf`);
      }

      setMessage(
        `${format.toUpperCase()} downloaded for ${student.name}.`,
      );
    } catch (error) {
      console.error("Certificate export failed:", error);
      setMessage("Could not generate this certificate. Please try again.");
    }
  }

  // Generate all certificates in ZIP
  async function downloadAllZip() {
    if (!backgroundImage || !stageRef.current || !textRef.current) {
      setMessage("Upload a certificate background first.");
      return;
    }

    if (!validStudents.length) {
      setMessage("Add at least one valid student name.");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setMessage("Preparing certificates...");

    const zip = new JSZip();

    try {
      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];

        const dataUrl = createCertificateImage(student.name);

        const baseName =
          `${String(i + 1).padStart(3, "0")}-${safeFileName(student.name)}`;

        if (zipFormat === "png") {
          const base64 = dataUrl.split(",")[1];

          if (!base64) {
            throw new Error(`Could not export ${student.name}.`);
          }

          zip.file(`${baseName}.png`, base64, {
            base64: true,
          });
        } else {
          const pdf = createPdf(dataUrl);
          zip.file(`${baseName}.pdf`, pdf.output("blob"));
        }

        setProgress(
          Math.round(((i + 1) / validStudents.length) * 100),
        );
      }

      const blob = await zip.generateAsync({ type: "blob" });

      downloadBlob(
        blob,
        `certificates-${zipFormat.toUpperCase()}.zip`,
      );

      setMessage(
        `Finished! ${validStudents.length} certificate(s) are ready in the ZIP file.`,
      );
    } catch (error) {
      console.error("Bulk generation failed:", error);

      setMessage(
        "Generation stopped because an export failed. Please try again with fewer students.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="bulk-page">
      <header className="bulk-heading">
        <div>
          <span className="eyebrow">BULK WORKSPACE</span>
          <h1>Bulk Certificate Generation</h1>
          <p>
            Customize once, preview, and generate certificates for every student.
          </p>
        </div>

        <span className="bulk-count">
          {validStudents.length} student(s)
        </span>
      </header>

      {/* Background and student list */}
      <div className="bulk-grid">
        <section className="bulk-panel">
          <h2>1. Certificate background</h2>

          <p className="bulk-description">
            Upload the template used for all certificates.
          </p>

          <input
            ref={backgroundRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={handleBackgroundUpload}
          />

          <button
            type="button"
            className="bulk-upload-button"
            onClick={() => backgroundRef.current?.click()}
          >
            Upload certificate background
          </button>

          {backgroundUrl && (
            <div className="bulk-background-preview">
              <img
                src={backgroundUrl}
                alt="Certificate background"
              />

              <button
                type="button"
                className="bulk-text-button"
                onClick={() => {
                  setBackgroundUrl("");
                  setBackgroundImage(null);
                }}
              >
                Remove background
              </button>
            </div>
          )}
        </section>

        <section className="bulk-panel">
          <h2>2. Student list</h2>

          <p className="bulk-description">
            Add names manually or import a spreadsheet.
          </p>

          <form
            className="bulk-add-form"
            onSubmit={(event) => {
              event.preventDefault();
              addStudent();
            }}
          >
            <input
              className="editor-input"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Enter a student name"
              aria-label="Student name"
            />

            <button type="submit" className="primary-button">
              Add
            </button>
          </form>

          <input
            ref={spreadsheetRef}
            type="file"
            accept=".xlsx,.csv"
            hidden
            onChange={handleSpreadsheetUpload}
          />

          <button
            type="button"
            className="bulk-upload-button"
            disabled={isImporting}
            onClick={() => spreadsheetRef.current?.click()}
          >
            {isImporting ? "Importing..." : "Import Excel or CSV"}
          </button>

          <p className="field-hint">
            Supported files: .xlsx and .csv. Use a Name or Student Name
            column, or put names in the first column.
          </p>
        </section>
      </div>

      {/* Name appearance settings */}
      <section className="bulk-panel">
        <h2>3. Name appearance</h2>

        <p className="bulk-description">
          These settings apply to every certificate in this bulk job.
        </p>

        <div className="bulk-settings-grid">
          <div>
            <label className="field-label" htmlFor="bulk-font">
              Font family
            </label>

            <select
              id="bulk-font"
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
          </div>

          <div>
            <label className="field-label" htmlFor="bulk-font-size">
              Font size: {fontSize}px
            </label>

            <input
              id="bulk-font-size"
              className="range-input"
              type="range"
              min={8}
              max={100}
              value={fontSize}
              onChange={(event) =>
                setFontSize(Number(event.target.value))
              }
            />
          </div>

          <div>
            <label className="field-label" htmlFor="bulk-font-color">
              Text color
            </label>

            <input
              id="bulk-font-color"
              className="color-input"
              type="color"
              value={fontColor}
              onChange={(event) => setFontColor(event.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="bulk-text-align">
              Text alignment
            </label>

            <select
              id="bulk-text-align"
              className="editor-input"
              value={textAlign}
              onChange={(event) =>
                setTextAlign(
                  event.target.value as "left" | "center" | "right",
                )
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </section>

      {/* Live certificate preview */}
      <section className="bulk-panel bulk-preview-panel">
        <div className="bulk-list-heading">
          <div>
            <h2>4. Live certificate preview</h2>

            <p className="bulk-description">
              Drag the name box to move it. Use the handles to resize it.
            </p>
          </div>

          <select
            className="editor-input bulk-preview-select"
            aria-label="Select student to preview"
            value={selectedStudent?.id ?? ""}
            onChange={(event) =>
              setSelectedStudentId(
                event.target.value
                  ? Number(event.target.value)
                  : null,
              )
            }
            disabled={!validStudents.length}
          >
            {validStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bulk-canvas-wrap">
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="bulk-certificate-stage"
          >
            <Layer>
              {backgroundImage ? (
                <KonvaImage
                  image={backgroundImage}
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  listening={false}
                />
              ) : (
                <>
                  <Rect
                    x={0}
                    y={0}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    fill="#ffffff"
                    listening={false}
                  />

                  <KonvaText
                    x={100}
                    y={270}
                    width={700}
                    text="Upload a certificate background to begin"
                    fontFamily="Arial"
                    fontSize={23}
                    fill="#85859a"
                    align="center"
                    listening={false}
                  />
                </>
              )}

              <Group
                ref={groupRef}
                x={textX}
                y={textY}
                width={textWidth}
                height={textHeight}
                draggable
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
              >
                <Rect
                  ref={outlineRef}
                  width={textWidth}
                  height={textHeight}
                  fill="#ffffff"
                  opacity={0.02}
                  stroke="#6555e9"
                  strokeWidth={1}
                  dash={[5, 4]}
                  listening={false}
                />

                <KonvaText
                  ref={textRef}
                  width={textWidth}
                  height={textHeight}
                  text={selectedStudent?.name ?? "Student Name"}
                  fontFamily={fontFamily}
                  fontSize={fontSize}
                  fill={fontColor}
                  align={textAlign}
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
                  "top-center",
                  "top-right",
                  "middle-left",
                  "middle-right",
                  "bottom-left",
                  "bottom-center",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (
                    newBox.width < 100 ||
                    newBox.height < 45
                  ) {
                    return oldBox;
                  }

                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>

        <p className="field-hint">
          Preview canvas: 900 × 600. The blue editing border and handles
          will not appear in downloaded certificates.
        </p>
      </section>

      {/* Review and download */}
      <section className="bulk-panel">
        <div className="bulk-list-heading">
          <div>
            <h2>5. Review and download</h2>

            <p className="bulk-description">
              Download one student's certificate or generate a ZIP for everyone.
            </p>
          </div>
        </div>

        {!students.length ? (
          <div className="bulk-empty-state">
            <h3>No students added yet</h3>
            <p>Add names above or import a spreadsheet.</p>
          </div>
        ) : (
          <div className="bulk-student-list">
            {students.map((student, index) => (
              <div className="bulk-student-row" key={student.id}>
                <span className="bulk-row-number">
                  {index + 1}
                </span>

                <input
                  className="editor-input"
                  value={student.name}
                  onChange={(event) =>
                    updateStudent(student.id, event.target.value)
                  }
                  aria-label={`Student ${index + 1} name`}
                />

                <div className="bulk-row-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      !backgroundImage ||
                      !student.name.trim() ||
                      isGenerating
                    }
                    onClick={() => downloadStudent(student, "png")}
                  >
                    PNG
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      !backgroundImage ||
                      !student.name.trim() ||
                      isGenerating
                    }
                    onClick={() => downloadStudent(student, "pdf")}
                  >
                    PDF
                  </button>

                  <button
                    type="button"
                    className="bulk-remove-button"
                    disabled={isGenerating}
                    onClick={() => removeStudent(student.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bulk-next-step">
          <div>
            <strong>Download all certificates</strong>

            <p>
              {validStudents.length} valid certificate(s) will be generated.
            </p>
          </div>

          <div className="bulk-download-all">
            <select
              className="editor-input"
              aria-label="ZIP certificate format"
              value={zipFormat}
              onChange={(event) =>
                setZipFormat(event.target.value as OutputFormat)
              }
              disabled={isGenerating}
            >
              <option value="pdf">PDF files in ZIP</option>
              <option value="png">PNG files in ZIP</option>
            </select>

            <button
              type="button"
              className="primary-button"
              disabled={
                !backgroundImage ||
                validStudents.length === 0 ||
                isGenerating
              }
              onClick={downloadAllZip}
            >
              {isGenerating
                ? `Generating ${progress}%`
                : "Download all ZIP"}
            </button>
          </div>
        </div>

        {isGenerating && (
          <progress
            className="bulk-progress"
            value={progress}
            max={100}
            aria-label="Certificate generation progress"
          />
        )}

        {message && (
          <p className="bulk-message" role="status">
            {message}
          </p>
        )}

        <div className="bulk-list-footer">
          <button
            type="button"
            className="bulk-text-button"
            disabled={isGenerating || !students.length}
            onClick={() => {
              setStudents([]);
              setSelectedStudentId(null);
              setMessage("Student list cleared.");
            }}
          >
            Clear all students
          </button>
        </div>
      </section>
    </main>
  );
}
