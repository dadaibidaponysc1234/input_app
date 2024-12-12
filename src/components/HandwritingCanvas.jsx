import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import "../App.css";
import { Pencil, Eraser } from "lucide-react";

const HandwritingCanvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [eraserMode, setEraserMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [pages, setPages] = useState([null]);
  const [currentPage, setCurrentPage] = useState(0);

  // Resize canvas dynamically
  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderCanvasPage();
    }
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const saveCurrentState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack([...undoStack, currentData]);
    setRedoStack([]); // Clear redo stack after new actions
  };

  const getPointerPosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const isTouch = e.touches && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // const handleStartDrawing = (x, y) => {
  //   setIsDrawing(true);
  //   saveCurrentState();
  //   const ctx = canvasRef.current.getContext("2d");
  //   ctx.beginPath();
  //   ctx.moveTo(x, y);
  // };
  const handleStartDrawing = (e) => {
    const { x, y } = getPointerPosition(e);
    setIsDrawing(true);
    saveCurrentState();
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // const handleDraw = (x, y) => {
  //   if (!isDrawing) return;
  //   const ctx = canvasRef.current.getContext("2d");
  //   ctx.lineWidth = strokeWidth;
  //   ctx.lineCap = "round";
  //   ctx.strokeStyle = eraserMode ? "#ffffff" : strokeColor;
  //   ctx.lineTo(x, y);
  //   ctx.stroke();
  // };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPointerPosition(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = eraserMode ? "#ffffff" : strokeColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const addEventListeners = () => {
    const canvas = canvasRef.current;
    canvas.addEventListener("touchstart", handleStartDrawing);
    canvas.addEventListener("touchmove", handleDraw);
    canvas.addEventListener("touchend", handleStopDrawing);
    canvas.addEventListener("mousedown", (e) => handleStartDrawing(e));
    canvas.addEventListener("mousemove", (e) => handleDraw(e));
    canvas.addEventListener("mouseup", handleStopDrawing);
    canvas.addEventListener("mouseout", handleStopDrawing);
  };

  const removeEventListeners = () => {
    const canvas = canvasRef.current;
    canvas.removeEventListener("touchstart", handleStartDrawing);
    canvas.removeEventListener("touchmove", handleDraw);
    canvas.removeEventListener("touchend", handleStopDrawing);
    canvas.removeEventListener("mousedown", handleStartDrawing);
    canvas.removeEventListener("mousemove", handleDraw);
    canvas.removeEventListener("mouseup", handleStopDrawing);
    canvas.removeEventListener("mouseout", handleStopDrawing);
  };

  useEffect(() => {
    addEventListeners();
    return removeEventListeners;
  }, [strokeColor, strokeWidth, eraserMode, isDrawing]);



  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    const lastState = undoStack.pop();
    setRedoStack([...redoStack, ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)]);
    ctx.putImageData(lastState, 0, 0);
    setUndoStack([...undoStack]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    const nextState = redoStack.pop();
    setUndoStack([...undoStack, ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)]);
    ctx.putImageData(nextState, 0, 0);
    setRedoStack([...redoStack]);
  };

  const handleClear = () => {
    const ctx = canvasRef.current.getContext("2d");
    saveCurrentState();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const savePageState = () => {
    const canvas = canvasRef.current;
    setPages((prevPages) => {
      const updatedPages = [...prevPages];
      updatedPages[currentPage] = canvas.toDataURL("image/png");
      return updatedPages;
    });
  };

  const handleNewPage = () => {
    savePageState();
    setCurrentPage((prevPage) => {
      const nextPage = prevPage + 1;
      setPages((prevPages) => {
        if (!prevPages[nextPage]) {
          return [...prevPages, null];
        }
        return prevPages;
      });
      return nextPage;
    });
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      savePageState();
      setCurrentPage(currentPage - 1);
    }
  };

  const renderCanvasPage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (pages[currentPage]) {
      const img = new Image();
      img.src = pages[currentPage];
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
    renderPageNumber();
  };

  const renderPageNumber = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.textAlign = "right";
    ctx.fillText(`Page ${currentPage + 1}`, canvas.width - 10, canvas.height - 10);
  };

  useEffect(renderCanvasPage, [currentPage]);

  const handleSavePDF = async () => {
    const pdf = new jsPDF();
    savePageState();

    for (let i = 0; i < pages.length; i++) {
      if (pages[i]) {
        if (i > 0) pdf.addPage();
        const img = new Image();
        img.src = pages[i];
        await new Promise((resolve) => {
          img.onload = () => {
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();
            pdf.addImage(img, "PNG", 0, 0, width, height);
            resolve();
          };
        });
      }
    }

    pdf.save("handwriting.pdf");
  };

  const handleDownloadCombinedImage = async () => {
    savePageState();

    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    const totalHeight = canvasHeight * pages.length;

    // Create a large canvas to hold all pages
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = canvasWidth;
    combinedCanvas.height = totalHeight;
    const ctx = combinedCanvas.getContext("2d");

    // Draw each page onto the combined canvas
    for (let i = 0; i < pages.length; i++) {
      if (pages[i]) {
        const img = new Image();
        img.src = pages[i];
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, i * canvasHeight, canvasWidth, canvasHeight);
            resolve();
          };
        });
      }
    }

    // Convert combined canvas to an image and trigger download
    const combinedImage = combinedCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = combinedImage;
    link.download = `combined-canvas-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <h1 className="text-2xl font-bold mb-4">Handwriting Tool</h1>
      <div className="mb-4 flex space-x-4">
        <Pencil onClick={() => setEraserMode(false)} className="h-8 w-8 cursor-pointer text-blue-500" />
        <Eraser onClick={() => setEraserMode(true)} className="h-8 w-8 cursor-pointer text-green-500" />
        <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
        <input type="range" min="1" max="40" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} />
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
      </div>
      <div ref={containerRef} className="w-11/12 h-[70vh] border-2">
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => handleStartDrawing(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onMouseMove={(e) => handleDraw(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onMouseUp={handleStopDrawing}
          onMouseOut={handleStopDrawing}
        ></canvas>
      </div>
      <div className="mb-4 flex space-x-4 mt-5">
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handlePrevPage}>Previous Page</button>
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleNewPage}>Next Page</button>
        <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={handleClear}>Clear</button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleSavePDF}>Save as PDF</button>
        <button className="px-4 py-2 bg-purple-500 text-white rounded" onClick={handleDownloadCombinedImage}>Download as Combined Image</button>
      </div>
    </div>
  );
};

export default HandwritingCanvas;
