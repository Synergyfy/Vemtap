"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Plus, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Move,
  Maximize2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  GripVertical,
  Type,
  ImageIcon,
  QrCode as QrIcon,
  Layers,
  ShieldCheck,
  Grid
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface EditorElement {
  id: string;
  type: 'text' | 'logo' | 'qr';
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number; // for QR
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  alignment?: 'left' | 'center' | 'right';
  locked?: boolean;
}

interface MarketingAssetEditorProps {
  initialElements: EditorElement[];
  backgroundColor: string;
  backgroundImage?: string;
  businessLogo?: string;
  qrUrl: string;
  mode: 'admin' | 'business';
  onChange: (data: { elements: EditorElement[], backgroundColor: string, backgroundImage?: string }) => void;
  onExport?: () => void;
}

export default function MarketingAssetEditor({
  initialElements,
  backgroundColor: initialBgColor,
  backgroundImage: initialBgImage,
  businessLogo,
  qrUrl,
  mode = 'business',
  onChange,
  onExport
}: MarketingAssetEditorProps) {
  const [elements, setElements] = useState<EditorElement[]>(initialElements);
  const [bgColor, setBgColor] = useState(initialBgColor);
  const [bgImage, setBgImage] = useState(initialBgImage);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync back to parent
  useEffect(() => {
    onChange({ elements, backgroundColor: bgColor, backgroundImage: bgImage });
  }, [elements, bgColor, bgImage]);

  const selectedElement = useMemo(() => elements.find(el => el.id === selectedElementId), [elements, selectedElementId]);

  // Handle Drag
  const handleDragStart = (el: EditorElement, startEvent: React.MouseEvent | React.TouchEvent) => {
    if (el.locked && mode === 'business') return;
    startEvent.stopPropagation();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = isTouchEvent ? startEvent.touches[0].clientY : startEvent.clientY;

    const initialX = el.x;
    const initialY = el.y;
    const elWidth = el.width || (el.type === 'qr' ? (el.size! / canvasRect.width) * 100 : 30);
    const elHeight = el.height || (el.type === 'qr' ? (el.size! / canvasRect.height) * 100 : 8);

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const isTouchMove = 'touches' in moveEvent;
      if (moveEvent.cancelable) moveEvent.preventDefault();

      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaXPct = ((currentX - startX) / canvasRect.width) * 100;
      const deltaYPct = ((currentY - startY) / canvasRect.height) * 100;

      let newX = Math.round(initialX + deltaXPct);
      let newY = Math.round(initialY + deltaYPct);

      // Snapping
      let activeGuides: { x?: number; y?: number } = {};
      const threshold = 2.5;

      // Canvas Center Snapping
      if (Math.abs((newX + elWidth / 2) - 50) < threshold) {
        newX = 50 - elWidth / 2;
        activeGuides.x = 50;
      }
      if (Math.abs((newY + elHeight / 2) - 50) < threshold) {
        newY = 50 - elHeight / 2;
        activeGuides.y = 50;
      }

      // Element-to-Element Snapping
      elements.forEach(other => {
        if (other.id === el.id) return;
        const oW = other.width || (other.type === 'qr' ? (other.size! / canvasRect.width) * 100 : 30);
        
        // Snap left edges
        if (Math.abs(newX - other.x) < threshold) {
            newX = other.x;
            activeGuides.x = other.x;
        }
        // Snap centers
        const oCenterX = other.x + oW/2;
        if (Math.abs((newX + elWidth/2) - oCenterX) < threshold) {
            newX = oCenterX - elWidth/2;
            activeGuides.x = oCenterX;
        }
      });

      newX = Math.max(0, Math.min(100 - elWidth, newX));
      newY = Math.max(0, Math.min(100 - elHeight, newY));

      setGuides(Object.keys(activeGuides).length > 0 ? activeGuides : null);
      setElements(prev => prev.map(item => item.id === el.id ? { ...item, x: newX, y: newY } : item));
    };

    const handleDragEnd = () => {
      setGuides(null);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  // Handle Resize
  const handleResizeStart = (el: EditorElement, startEvent: React.MouseEvent | React.TouchEvent, dir: string) => {
    if (el.locked && mode === 'business') return;
    startEvent.stopPropagation();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = isTouchEvent ? startEvent.touches[0].clientY : startEvent.clientY;

    const initialX = el.x;
    const initialY = el.y;
    const initialWidth = el.width || (el.type === 'qr' ? (el.size! / canvasRect.width) * 100 : 30);
    const initialHeight = el.height || (el.type === 'qr' ? (el.size! / canvasRect.height) * 100 : 8);
    const initialSize = el.size || 120;
    const initialFontSize = el.fontSize || 14;

    const handleResizeMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const isTouchMove = 'touches' in moveEvent;
      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaXPct = ((currentX - startX) / canvasRect.width) * 100;
      const deltaYPct = ((currentY - startY) / canvasRect.height) * 100;
      const deltaX = currentX - startX;

      let updates: Partial<EditorElement> = {};

      if (el.type === 'text') {
        if (['nw', 'ne', 'se', 'sw'].includes(dir)) {
          const factor = (dir === 'se' || dir === 'ne') ? 1 : -1;
          updates.fontSize = Math.max(6, Math.min(100, Math.round(initialFontSize + (deltaX * factor) / 3)));
        } else {
          if (dir === 'e') updates.width = Math.max(5, Math.min(100, Math.round(initialWidth + deltaXPct)));
          if (dir === 'w') {
            updates.width = Math.max(5, Math.min(100, Math.round(initialWidth - deltaXPct)));
            updates.x = Math.max(0, Math.round(initialX + deltaXPct));
          }
        }
      } else if (el.type === 'qr') {
        const factor = (dir === 'se' || dir === 'e' || dir === 's') ? 1 : -1;
        updates.size = Math.max(40, Math.min(300, Math.round(initialSize + deltaX * factor)));
        if (factor === -1) {
            updates.x = Math.max(0, Math.round(initialX + deltaXPct));
            updates.y = Math.max(0, Math.round(initialY + (deltaX / canvasRect.height) * 100));
        }
      } else if (el.type === 'logo') {
        if (dir === 'se') {
          updates.width = Math.max(5, Math.min(100, Math.round(initialWidth + deltaXPct)));
          updates.height = Math.max(2, Math.min(50, Math.round(initialHeight + deltaYPct)));
        }
      }

      setElements(prev => prev.map(item => item.id === el.id ? { ...item, ...updates } : item));
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeEnd);
  };

  const addElement = (type: EditorElement['type']) => {
    const id = `${type}-${Date.now()}`;
    let newEl: EditorElement;
    if (type === 'text') {
      newEl = { id, type, text: 'New Text', x: 20, y: 20, fontSize: 16, color: '#0F172A', fontWeight: 'bold', alignment: 'center', width: 60 };
    } else if (type === 'qr') {
      if (elements.some(e => e.type === 'qr')) return toast.error('Only one QR allowed');
      newEl = { id, type, x: 30, y: 50, size: 120 };
    } else {
      if (elements.some(e => e.type === 'logo')) return toast.error('Only one Logo allowed');
      newEl = { id, type, x: 35, y: 10, width: 30, height: 10 };
    }
    setElements([...elements, newEl]);
    setSelectedElementId(id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 space-y-6 shrink-0">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Editor</h3>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowGrid(!showGrid)}
                    className={cn("p-2 rounded-xl transition-all", showGrid ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-400")}
                    title="Toggle Grid"
                >
                    <Grid size={16} />
                </button>
            </div>
          </div>

          {/* Element Tabs */}
          <div className="space-y-4">
            {mode === 'admin' && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => addElement('text')} size="sm" variant="outline" className="rounded-xl gap-2 text-[10px] uppercase font-black"><Type size={14} /> Text</Button>
                <Button onClick={() => addElement('logo')} size="sm" variant="outline" className="rounded-xl gap-2 text-[10px] uppercase font-black"><ImageIcon size={14} /> Logo</Button>
                <Button onClick={() => addElement('qr')} size="sm" variant="outline" className="rounded-xl gap-2 text-[10px] uppercase font-black"><QrIcon size={14} /> QR</Button>
              </div>
            )}

            {selectedElement ? (
              <motion.div 
                key={selectedElement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-4 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {selectedElement.type} Settings
                    </span>
                    {(!selectedElement.locked || mode === 'admin') && (
                        <button onClick={() => setElements(elements.filter(e => e.id !== selectedElement.id))} className="text-red-400 hover:text-red-500">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {selectedElement.type === 'text' && (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={selectedElement.text} 
                      onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, text: e.target.value } : el))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-gray-400">Size</span>
                            <input type="number" value={selectedElement.fontSize} onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, fontSize: Number(e.target.value) } : el))} className="w-full p-1.5 text-xs rounded-lg border border-gray-200" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-gray-400">Color</span>
                            <input type="color" value={selectedElement.color} onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, color: e.target.value } : el))} className="w-full h-8 rounded-lg cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200">
                        {['left', 'center', 'right'].map(align => (
                            <button 
                                key={align}
                                onClick={() => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, alignment: align as any } : el))}
                                className={cn("flex-1 p-1.5 rounded-lg transition-all", selectedElement.alignment === align ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-50")}
                            >
                                {align === 'left' && <AlignLeft size={14} className="mx-auto" />}
                                {align === 'center' && <AlignCenter size={14} className="mx-auto" />}
                                {align === 'right' && <AlignRight size={14} className="mx-auto" />}
                            </button>
                        ))}
                    </div>
                  </div>
                )}

                {selectedElement.type === 'qr' && (
                    <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-gray-400">QR Size</span>
                        <input type="range" min="40" max="300" value={selectedElement.size} onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, size: Number(e.target.value) } : el))} className="w-full accent-primary" />
                    </div>
                )}

                <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-gray-400">X: {selectedElement.x}%</span>
                        <input type="range" min="0" max="100" value={selectedElement.x} onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, x: Number(e.target.value) } : el))} className="w-full accent-primary" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-gray-400">Y: {selectedElement.y}%</span>
                        <input type="range" min="0" max="100" value={selectedElement.y} onChange={(e) => setElements(elements.map(el => el.id === selectedElement.id ? { ...el, y: Number(e.target.value) } : el))} className="w-full accent-primary" />
                    </div>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 text-center">
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed italic">
                    "Select any element on the canvas to customize its appearance."
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page Background</h4>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-gray-400">Color</span>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-gray-200" />
                </div>
                {mode === 'admin' && (
                    <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-gray-400">Image URL</span>
                        <input type="text" value={bgImage} onChange={(e) => setBgImage(e.target.value)} className="w-full px-2 py-1.5 text-[10px] rounded-xl border border-gray-200" placeholder="https://..." />
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-start gap-4">
            <div className="size-10 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <ShieldCheck size={20} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-emerald-900 leading-none">Safe Print Zone</p>
                <p className="text-[8px] font-bold text-emerald-700/80 leading-normal">
                    Elements are bounded within professional printing limits to ensure no content is cut off during production.
                </p>
            </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-200/50 rounded-[3rem] p-8 md:p-12 flex items-center justify-center min-h-[600px] relative overflow-hidden shadow-inner border-4 border-white">
        {/* Safe Print Zone Boundary Indicators */}
        <div className="absolute inset-0 pointer-events-none opacity-20 border-[24px] border-dashed border-gray-400" />
        
        <div
          ref={canvasRef}
          onClick={() => setSelectedElementId(null)}
          style={{
            backgroundColor: bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          className="w-[320px] aspect-[4/6] rounded-[2rem] shadow-2xl relative overflow-hidden ring-[12px] ring-white/50"
        >
          {/* Alignment Guides */}
          {guides?.x !== undefined && <div className="absolute top-0 bottom-0 w-px bg-pink-500 z-50" style={{ left: `${guides.x}%` }} />}
          {guides?.y !== undefined && <div className="absolute left-0 right-0 h-px bg-pink-500 z-50" style={{ top: `${guides.y}%` }} />}

          {/* Grid */}
          {showGrid && (
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
            />
          )}

          {/* Elements Renderer */}
          {elements.map((el) => {
            const isSelected = selectedElementId === el.id;
            const isLocked = el.locked && mode === 'business';

            return (
              <motion.div
                key={el.id}
                onMouseDown={(e) => { setSelectedElementId(el.id); handleDragStart(el, e); }}
                onTouchStart={(e) => { setSelectedElementId(el.id); handleDragStart(el, e); }}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: el.width ? `${el.width}%` : (el.type === 'qr' ? 'auto' : 'auto'),
                  height: el.height ? `${el.height}%` : 'auto',
                  cursor: isLocked ? 'default' : 'move',
                  zIndex: el.type === 'logo' ? 30 : (el.type === 'qr' ? 20 : 10),
                  border: isSelected ? '2px dashed #066CF4' : '1px dashed transparent',
                  padding: '4px'
                }}
                className={cn("group transition-all select-none", isSelected && "bg-white/5 backdrop-blur-[1px]")}
              >
                {/* Element Content */}
                {el.type === 'text' && (
                  <div 
                    style={{ 
                        color: el.color, 
                        fontSize: `${el.fontSize}px`, 
                        fontWeight: el.fontWeight, 
                        textAlign: el.alignment 
                    }}
                    className="w-full leading-tight break-words"
                  >
                    {el.text}
                  </div>
                )}

                {el.type === 'qr' && (
                  <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                    <QRCodeSVG 
                        value={qrUrl} 
                        size={el.size} 
                        level="H" 
                        includeMargin={false}
                        imageSettings={businessLogo ? {
                            src: businessLogo,
                            height: (el.size || 100) * 0.2,
                            width: (el.size || 100) * 0.2,
                            excavate: true,
                        } : undefined}
                    />
                  </div>
                )}

                {el.type === 'logo' && (
                  <div className="w-full h-full flex items-center justify-center min-h-[40px]">
                    {businessLogo ? (
                        <img src={businessLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full border border-white/20 flex items-center justify-center text-[8px] font-black text-white/40 uppercase">Logo Slot</div>
                    )}
                  </div>
                )}

                {/* Resize Handles (8-way) */}
                {isSelected && !isLocked && (
                    <>
                        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(dir => (
                            <div
                                key={dir}
                                onMouseDown={(e) => handleResizeStart(el, e, dir)}
                                onTouchStart={(e) => handleResizeStart(el, e, dir)}
                                style={{
                                    position: 'absolute',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#066CF4',
                                    border: '1.5px solid white',
                                    borderRadius: '50%',
                                    zIndex: 100,
                                    ...(dir === 'nw' ? { top: -5, left: -5, cursor: 'nw-resize' } : {}),
                                    ...(dir === 'n' ? { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } : {}),
                                    ...(dir === 'ne' ? { top: -5, right: -5, cursor: 'ne-resize' } : {}),
                                    ...(dir === 'e' ? { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' } : {}),
                                    ...(dir === 'se' ? { bottom: -5, right: -5, cursor: 'se-resize' } : {}),
                                    ...(dir === 's' ? { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } : {}),
                                    ...(dir === 'sw' ? { bottom: -5, left: -5, cursor: 'sw-resize' } : {}),
                                    ...(dir === 'w' ? { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' } : {}),
                                }}
                                className="shadow-lg hover:scale-125 transition-transform"
                            />
                        ))}
                    </>
                )}

                {/* Locked Indicator */}
                {isLocked && (
                    <div className="absolute -top-4 -right-4 size-6 rounded-full bg-gray-900/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/20">
                        <ShieldCheck size={10} />
                    </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
