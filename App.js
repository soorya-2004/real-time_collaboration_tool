import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

function App() {
  const canvasRef = useRef();
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(10);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const draw = ({ x0, y0, x1, y1, color, lineWidth }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();
    };

    socket.on("drawing", draw);

    const clearHandler = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("clear", clearHandler);

    return () => {
      socket.off("drawing", draw);
      socket.off("clear", clearHandler);
    };
  }, []);

  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = isErasing ? "#ffffff" : color;
    ctx.lineWidth = isErasing ? eraserSize : lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(newX, newY);
    ctx.stroke();
    ctx.closePath();

    socket.emit("drawing", {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: newX,
      y1: newY,
      color: isErasing ? "#ffffff" : color,
      lineWidth: isErasing ? eraserSize : lineWidth,
    });

    lastPos.current = { x: newX, y: newY };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;

    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    const newCtx = newCanvas.getContext("2d");

    newCtx.fillStyle = "#ffffff";
    newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);

    newCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = newCanvas.toDataURL("image/png");
    link.click();
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit("clear");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🖌️ Real-Time Whiteboard</h2>
      <button onClick={downloadCanvas}>Download as PNG</button>

      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={() => setIsErasing(!isErasing)}
          style={{ marginRight: "20px" }}
        >
          {isErasing ? "Switch to Pen" : "Switch to Eraser"}
        </button>

        {!isErasing && (
          <>
            <label>Color: </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <label style={{ marginLeft: "20px" }}>Line Width: </label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
            />
          </>
        )}

        {isErasing && (
          <>
            <label>Eraser Size: </label>
            <input
              type="range"
              min="5"
              max="50"
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
            />
          </>
        )}

        <button onClick={clearCanvas} style={{ marginLeft: "20px" }}>
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ border: "1px solid black", cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}

export default App;
