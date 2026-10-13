import React, { useRef, useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';

export default function PosterCanvas({ templateImg, userImg, zoom, setZoom, pos, setPos, isDragging, setIsDragging, dragStart, setDragStart, onAddClick, showAdd }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  
  const initialPinchDist = useRef(null);
  const initialZoom = useRef(zoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !templateImg) return;

    const observer = new ResizeObserver(() => {
      const maxWidth = wrapper.clientWidth;
      const maxHeight = wrapper.clientHeight;
      const imgRatio = templateImg.width / templateImg.height;
      
      let displayWidth = maxWidth;
      let displayHeight = displayWidth / imgRatio;
      
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * imgRatio;
      }
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const scaleFactor = displayWidth / templateImg.width;
      setScale(scaleFactor);
      drawCanvas(canvas, canvas.getContext('2d'), scaleFactor, dpr);
    });

    observer.observe(wrapper);
    drawCanvas(canvas, canvas.getContext('2d'), scale, window.devicePixelRatio || 1);
    
    return () => observer.disconnect();
  }, [templateImg, userImg, pos, zoom, scale]);

  const drawCanvas = (canvas, ctx, currentScale, dpr) => {
    if (!templateImg || canvas.width === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(currentScale * dpr, currentScale * dpr);

    if (userImg) {
      const sW = userImg.width * zoom;
      const sH = userImg.height * zoom;
      const cx = (templateImg.width / 2) + pos.x;
      const cy = (templateImg.height / 2) + pos.y;
      ctx.drawImage(userImg, cx - (sW / 2), cy - (sH / 2), sW, sH);
    }
    ctx.drawImage(templateImg, 0, 0, templateImg.width, templateImg.height);
    ctx.restore();
  };

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (!userImg) return;
    if (e.touches && e.touches.length === 2) {
      initialPinchDist.current = getDistance(e.touches);
      initialZoom.current = zoom;
    } else {
      setIsDragging(true);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX - (pos.x * scale), y: clientY - (pos.y * scale) });
    }
  };

  const handleTouchMove = (e) => {
    if (!userImg) return;
    e.preventDefault();
    if (e.touches && e.touches.length === 2 && initialPinchDist.current) {
      const currentDist = getDistance(e.touches);
      const ratio = currentDist / initialPinchDist.current;
      let newZoom = initialZoom.current * ratio;
      newZoom = Math.min(Math.max(newZoom, 0.1), 4);
      setZoom(newZoom);
    } else if (isDragging) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({ x: (clientX - dragStart.x) / scale, y: (clientY - dragStart.y) / scale });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches && e.touches.length < 2) initialPinchDist.current = null;
    if (!e.touches || e.touches.length === 0) setIsDragging(false);
  };

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      {/* The inner container shrink-wraps the canvas. This allows the absolute positioning of the + button to map exactly to the poster's coordinates */}
      <div className="canvas-inner">
        <canvas
          className="canvas-layer"
          ref={canvasRef}
          onMouseDown={handleTouchStart} onMouseMove={handleTouchMove} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : (userImg ? 'grab' : 'default'), touchAction: 'none' }}
        />
        
        {showAdd && (
          <div className="add-photo-btn" onClick={onAddClick}>
            <FiPlus />
          </div>
        )}
      </div>
    </div>
  );
}