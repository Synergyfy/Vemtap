'use client';

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { GripVertical, X, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import type { BusinessForm } from '@/services/business-forms/types';

interface DraggableButtonListProps {
    forms: BusinessForm[];
    onReorder: (sourceIndex: number, targetIndex: number) => void;
    onRemove?: (id: string) => void;
}

const DRAG_STEP = 72; // h-16 (64) + gap-2 (8)

export default function DraggableButtonList({ forms, onReorder, onRemove }: DraggableButtonListProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragEpoch, setDragEpoch] = useState(0);
    const dragRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

    const getNodeRef = (id: string) => {
        if (!dragRefs.current[id]) {
            dragRefs.current[id] = React.createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement>;
        }
        return dragRefs.current[id];
    };

    return (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 relative">
            {forms.map((form, index) => {
                const nodeRef = getNodeRef(form.id);
                return (
                    <Draggable
                        key={`${form.id}-${dragEpoch}`}
                        axis="y"
                        nodeRef={nodeRef}
                        handle=".drag-handle"
                        onStart={() => setDraggedId(form.id)}
                        onStop={(e, data) => {
                            const moveBy = Math.round(data.y / DRAG_STEP);
                            const targetIndex = Math.max(0, Math.min(forms.length - 1, index + moveBy));
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
                                draggedId === form.id 
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
                                <span className="text-sm font-bold text-gray-900 truncate block">
                                    {form.title || 'Untitled Form'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <FileText size={10} className="text-gray-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block truncate">
                                        Form Step
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
                                    disabled={index === forms.length - 1}
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
                                        onRemove(form.id);
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
