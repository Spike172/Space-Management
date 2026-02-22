import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Line, Circle, Text } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// pdfjs v3 worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const ROOM_COLORS = [
  "#93C5FD", "#86EFAC", "#FCD34D", "#F9A8D4", "#A5B4FC",
  "#6EE7B7", "#FCA5A5", "#C4B5FD", "#67E8F9", "#FDE68A",
];

const USE_TYPES = [
  "Office", "Conference Room", "Corridor", "Storage", "Restroom",
  "Open Area", "Lab", "Reception", "Utility", "Other"
];

export default function Editor() {
  const [pdfImage, setPdfImage] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });
  const [tool, setTool] = useState("select");
  const [rooms, setRooms] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [scale, setScale] = useState(1);
  const [pdfError, setPdfError] = useState("");
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const columnDefs = [
    { field: "id", headerName: "ID", width: 60, editable: false },
    { field: "name", headerName: "Room Name", editable: true, flex: 1 },
    {
      field: "useType", headerName: "Use Type", editable: true, flex: 1,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: USE_TYPES },
    },
    { field: "area", headerName: "Area (sq ft)", editable: true, width: 120,
      valueParser: (p) => Number(p.newValue) },
    { field: "department", headerName: "Department", editable: true, flex: 1 },
    { field: "notes", headerName: "Notes", editable: true, flex: 1 },
  ];

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;

      const img = new window.Image();
      img.src = canvas.toDataURL();
      img.onload = () => {
        setPdfImage(img);
        const scaleX = stageSize.width / viewport.width;
        setScale(Math.min(scaleX, 1));
      };
    } catch (err) {
      console.error(err);
      setPdfError("Failed to load PDF. Make sure it's a valid PDF file.");
    }
  };

  const getPointerPos = () => {
    const pos = stageRef.current.getPointerPosition();
    return { x: pos.x / scale, y: pos.y / scale };
  };

  const handleMouseDown = () => {
    if (tool === "rect") {
      const pos = getPointerPos();
      setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setDrawing(true);
    } else if (tool === "polygon") {
      const pos = getPointerPos();
      setPolygonPoints((pts) => [...pts, pos.x, pos.y]);
    } else if (tool === "select") {
      setSelectedId(null);
    }
  };

  const handleMouseMove = () => {
    if (tool === "rect" && drawing && currentRect) {
      const pos = getPointerPos();
      setCurrentRect((r) => ({ ...r, width: pos.x - r.x, height: pos.y - r.y }));
    }
  };

  const handleMouseUp = () => {
    if (tool === "rect" && drawing && currentRect) {
      setDrawing(false);
      if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
        const newRoom = {
          id: rooms.length + 1,
          type: "rect",
          x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
          y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
          width: Math.abs(currentRect.width),
          height: Math.abs(currentRect.height),
          name: `Room ${rooms.length + 1}`,
          useType: "Office",
          area: Math.round(Math.abs(currentRect.width) * Math.abs(currentRect.height) / 100),
          department: "",
          notes: "",
          color: ROOM_COLORS[rooms.length % ROOM_COLORS.length],
        };
        setRooms((r) => [...r, newRoom]);
      }
      setCurrentRect(null);
    }
  };

  const finishPolygon = () => {
    if (polygonPoints.length < 6) return;
    const newRoom = {
      id: rooms.length + 1,
      type: "polygon",
      points: polygonPoints,
      name: `Room ${rooms.length + 1}`,
      useType: "Office",
      area: 0,
      department: "",
      notes: "",
      color: ROOM_COLORS[rooms.length % ROOM_COLORS.length],
    };
    setRooms((r) => [...r, newRoom]);
    setPolygonPoints([]);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setRooms((r) => r.filter((room) => room.id !== selectedId));
    setSelectedId(null);
  };

  const onCellValueChanged = (params) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === params.data.id ? { ...r, ...params.data } : r))
    );
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "Use Type", "Area (sq ft)", "Department", "Notes"];
    const rows = rooms.map((r) =>
      [r.id, r.name, r.useType, r.area, r.department, r.notes].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "space-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <span className="font-semibold text-gray-700 mr-2">Floor Plan Editor</span>

        <label className="cursor-pointer px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition">
          📄 Load PDF
          <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
        </label>

        <div className="h-6 w-px bg-gray-300" />

        {[
          { id: "select", label: "↖ Select" },
          { id: "rect", label: "⬜ Rectangle" },
          { id: "polygon", label: "⬡ Polygon" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setPolygonPoints([]); }}
            className={`px-3 py-2 text-sm rounded-md border transition ${
              tool === t.id
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}

        {tool === "polygon" && polygonPoints.length >= 6 && (
          <button
            onClick={finishPolygon}
            className="px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition"
          >
            ✓ Finish Polygon
          </button>
        )}

        {selectedId && (
          <button
            onClick={deleteSelected}
            className="px-3 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 transition"
          >
            🗑 Delete Room
          </button>
        )}

        <div className="ml-auto">
          <button
            onClick={exportCSV}
            disabled={rooms.length === 0}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ❌ {pdfError}
        </div>
      )}

      {/* Canvas */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full"
          style={{ height: "560px", background: "#F8FAFC", cursor: tool === "select" ? "default" : "crosshair" }}
        >
          {!pdfImage && (
            <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
              <span className="text-4xl">🗺️</span>
              <span className="text-lg">Load a PDF floor plan to get started</span>
              <span className="text-sm">Then use the Rectangle or Polygon tool to draw rooms</span>
            </div>
          )}
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {pdfImage && (
                <KonvaImage
                  image={pdfImage}
                  x={0}
                  y={0}
                  width={pdfImage.naturalWidth}
                  height={pdfImage.naturalHeight}
                />
              )}

              {rooms.map((room) => {
                const isSelected = room.id === selectedId;
                if (room.type === "rect") {
                  return (
                    <React.Fragment key={room.id}>
                      <Rect
                        x={room.x}
                        y={room.y}
                        width={room.width}
                        height={room.height}
                        fill={room.color}
                        opacity={0.45}
                        stroke={isSelected ? "#1D4ED8" : "#374151"}
                        strokeWidth={isSelected ? 2 : 1}
                        onClick={() => tool === "select" && setSelectedId(room.id)}
                      />
                      <Text
                        x={room.x + 4}
                        y={room.y + 4}
                        text={room.name}
                        fontSize={11}
                        fill="#1F2937"
                        listening={false}
                      />
                    </React.Fragment>
                  );
                }
                if (room.type === "polygon") {
                  return (
                    <React.Fragment key={room.id}>
                      <Line
                        points={room.points}
                        fill={room.color}
                        opacity={0.45}
                        stroke={isSelected ? "#1D4ED8" : "#374151"}
                        strokeWidth={isSelected ? 2 : 1}
                        closed
                        onClick={() => tool === "select" && setSelectedId(room.id)}
                      />
                      <Text
                        x={room.points[0] + 4}
                        y={room.points[1] + 4}
                        text={room.name}
                        fontSize={11}
                        fill="#1F2937"
                        listening={false}
                      />
                    </React.Fragment>
                  );
                }
                return null;
              })}

              {currentRect && (
                <Rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  fill="#93C5FD"
                  opacity={0.35}
                  stroke="#3B82F6"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              )}

              {polygonPoints.length > 0 && (
                <>
                  <Line
                    points={polygonPoints}
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    dash={[4, 4]}
                  />
                  {Array.from({ length: polygonPoints.length / 2 }).map((_, i) => (
                    <Circle
                      key={i}
                      x={polygonPoints[i * 2]}
                      y={polygonPoints[i * 2 + 1]}
                      radius={4}
                      fill="#3B82F6"
                    />
                  ))}
                </>
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">
            Room Data — {rooms.length} room{rooms.length !== 1 ? "s" : ""}
          </h3>
          <span className="text-xs text-gray-400">Click any cell to edit</span>
        </div>
        {rooms.length === 0 ? (
          <div className="text-center text-gray-400 py-8 border border-dashed border-gray-300 rounded-xl">
            Draw rooms on the floor plan to populate this table
          </div>
        ) : (
          <div className="ag-theme-alpine w-full" style={{ height: 300 }}>
            <AgGridReact
              rowData={rooms}
              columnDefs={columnDefs}
              onCellValueChanged={onCellValueChanged}
              getRowId={(p) => String(p.data.id)}
              stopEditingWhenCellsLoseFocus
              onRowClicked={(e) => setSelectedId(e.data.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}