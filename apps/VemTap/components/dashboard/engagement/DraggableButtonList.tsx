'use client';

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { GripVertical, X, FileText, ChevronUp, ChevronDown } from 'lucide-react';
interface DraggableItem {
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

interface DraggableButtonListProps {
    items: DraggableItem[];
    onReorder: (sourceIndex: number, targetIndex: number) => void;
    onRemove?: (id: string) => void;
    onRename?: (id: string, newTitle: string) => void;
}

const DRAG_STEP = 72; // h-16 (64) + gap-2 (8)

export default function DraggableButtonList({ items, onReorder, onRemove, onRename }: DraggableButtonListProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragEpoch, setDragEpoch] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const dragRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

    const getNodeRef = (id: string) => {
        if (!dragRefs.current[id]) {
            dragRefs.current[id] = React.createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement>;
        }
        return dragRefs.current[id];
    };

    return (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 relative">
            {items.map((item, index) => {
                const nodeRef = getNodeRef(item.id);
                return (
                    <Draggable
                        key={`${item.id}-${dragEpoch}`}
                        axis="y"
                        nodeRef={nodeRef}
                        handle=".drag-handle"
                        onStart={() => setDraggedId(item.id)}
                        onStop={(e, data) => {
                            const moveBy = Math.round(data.y / DRAG_STEP);
                            const targetIndex = Math.max(0, Math.min(items.length - 1, index + moveBy));
                            if (moveBy !== 0 && targetIndex !== index) {
                                onReorder(index, targetIndex);
                            }
                            setDraggedId(null);
                            setDragEpoch((val) => val + 1);
                        }}
                    >
                        <div
                            ref={nodeRef}
                            className={`h-16 w-full rounded-xl bg-white border items-center flex px-3 gap-3 transition-colors ${
                                draggedId === item.id 
                                ? 'border-primary ring-4 ring-primary/10 shadow-lg z-50 absolute inset-x-0' 
                                : 'border-gray-200 shadow-sm relative z-0'
                            }`}
                        >
                            <div className="drag-handle p-2 -ml-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors">
                                <GripVertical size={16} />
                            </div>
                            
                            <div className="flex-shrink-0 size-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <span className="text-xs font-black text-slate-500">{index + 1}</span>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {editingId === item.id ? (
                                    <input 
                                        type="text"
                                        autoFocus
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => {
                                            if (onRename && editValue.trim() !== '') {
                                                onRename(item.id, editValue.trim());
                                            }
                                            setEditingId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (onRename && editValue.trim() !== '') {
                                                    onRename(item.id, editValue.trim());
                                                }
                                                setEditingId(null);
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingId(null);
                                            }
                                        }}
                                        className="text-sm font-bold text-gray-900 bg-white border-b border-primary outline-none px-1 py-0.5 w-full"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-900 truncate block group/title flex items-center gap-2">
                                        {item.title}
                                        {onRename && (
                                            <button 
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    setEditValue(item.title);
                                                }}
                                                className="text-gray-300 hover:text-primary transition-colors p-1 rounded hover:bg-gray-50 opacity-0 group-hover/title:opacity-100"
                                                title="Rename item"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                            </button>
                                        )}
                                    </span>
                                )}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {item.icon || <FileText size={10} className="text-gray-400" />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block truncate">
                                        {item.subtitle || 'Step Item'}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow Order Controls */}
                            <div className="flex flex-col border-l border-gray-100 pl-2 mr-1">
                                <button
                                    disabled={index === 0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onReorder(index, index - 1);
                                    }}
                                    className="p-1 text-gray-400 hover:text-primary hover:bg-primary/5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Move Up"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    disabled={index === items.length - 1}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onReorder(index, index + 1);
                                    }}
                                    className="p-1 text-gray-400 hover:text-primary hover:bg-primary/5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Move Down"
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </div>

                            {onRemove && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onRemove(item.id);
                                    }}
                                    className="p-2 -mr-1 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors shrink-0"
                                    title="Remove from sequence"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </Draggable>
                );
            })}
        </div>
    );
}
