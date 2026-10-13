import React, { useState, useEffect, useRef } from 'react';
import PosterCanvas from './PosterCanvas';
import { FiTrash2, FiDownload } from 'react-icons/fi';

export default function App() {
  const [templates, setTemplates] = useState({ '10000': null, '5000': null });
  const [templateType, setTemplateType] = useState('10000'); 
  const [sponsorName, setSponsorName] = useState('');
  
  const [userImg, setUserImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadImg = (src) => new Promise((res) => {
      const img = new Image();
      img.src = src;
      img.onload = () => res(img);
    });
    Promise.all([loadImg('/template10k.png'), loadImg('/template5k.png')])
      .then(([img10k, img5k]) => setTemplates({ '10000': img10k, '5000': img5k }));
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => { setUserImg(img); setZoom(1); setPos({ x: 0, y: 0 }); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const exportPoster = () => {
    const activeTpl = templates[templateType];
    if (!userImg || !activeTpl) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = activeTpl.width;
    canvas.height = activeTpl.height;
    const ctx = canvas.getContext("2d");

    const sW = userImg.width * zoom;
    const sH = userImg.height * zoom;
    const cx = (activeTpl.width / 2) + pos.x;
    const cy = (activeTpl.height / 2) + pos.y;
    
    ctx.drawImage(userImg, cx - (sW / 2), cy - (sH / 2), sW, sH);
    ctx.drawImage(activeTpl, 0, 0, activeTpl.width, activeTpl.height);

    const safeName = sponsorName.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'Sponsor';
    const link = document.createElement("a");
    link.download = `${safeName}-${templateType === '10000' ? '10k' : '5k'}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="app-layout">
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />

      <header className="header">
        <h1 className="title">Time of Echos</h1>
        <div className="subtitle">STUDIO</div>
      </header>

      <main className="preview-area">
        <PosterCanvas 
          templateImg={templates[templateType]} userImg={userImg} zoom={zoom} setZoom={setZoom}
          pos={pos} setPos={setPos} isDragging={isDragging} setIsDragging={setIsDragging}
          dragStart={dragStart} setDragStart={setDragStart}
          showAdd={!userImg && templates[templateType]}
          onAddClick={() => fileInputRef.current.click()}
        />
      </main>

      <div className="bottom-panel-container">
        <aside className="bottom-panel">
          
          <div className="toggle-group">
            <div className="toggle-slider" style={{ transform: templateType === '10000' ? 'translateX(0)' : 'translateX(100%)' }} />
            <button className={`toggle-btn ${templateType === '10000' ? 'active' : ''}`} onClick={() => setTemplateType('10000')}>10,000</button>
            <button className={`toggle-btn ${templateType === '5000' ? 'active' : ''}`} onClick={() => setTemplateType('5000')}>5,000</button>
          </div>

          <input 
            className="text-input" type="text" placeholder="Sponsor Name..."
            value={sponsorName} onChange={(e) => setSponsorName(e.target.value)}
          />

          {userImg && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                <span>Zoom (Pinch or Slide)</span>
                <span style={{ color: 'var(--gold-main)' }}>{Math.round(zoom * 100)}%</span>
              </div>
              <input type="range" min="0.1" max="4" step="0.02" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
            </div>
          )}

          <div className="action-row">
            {userImg && (
              <button className="btn-icon" onClick={() => setUserImg(null)} title="Clear Photo">
                <FiTrash2 />
              </button>
            )}
            
            <button className="btn-export" onClick={exportPoster} disabled={!userImg}>
              <FiDownload size={22} /> Export Poster
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}