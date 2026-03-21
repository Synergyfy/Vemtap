'use client';

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import type { BusinessForm } from '@/services/business-forms/types';

interface DraggableButtonListProps {
    forms: BusinessForm[];
    brandColor: string;
    onReorder: (sourceIndex: number, targetIndex: number) => void;
}

const DRAG_STEP = 56; // h-11 (44) + gap-3 (12)

export default function DraggableButtonList({ forms, brandColor, onReorder }: DraggableButtonListProps) {
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
        <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
            {forms.map((form, index) => {
                const nodeRef = getNodeRef(form.id);
                return (
                    <Draggable
                        key={`${form.id}-${dragEpoch}`}
                        axis="y"
                        nodeRef={nodeRef}
                        onStart={() => setDraggedId(form.id)}
                        onStop={(_, data) => {
                            const moveBy = Math.round(data.y / DRAG_STEP);
                            const targetIndex = Math.max(0, Math.min(forms.length - 1, index + moveBy));
                            if (moveBy !== 0) {
                                onReorder(index, targetIndex);
                            }
                            setDraggedId(null);
                            setDragEpoch((val) => val + 1);
                        }}
                    >
                        <div
                            ref={nodeRef}
                            className={`h-11 w-full rounded-xl px-4 text-sm font-semibold shadow-sm transition-all cursor-grab active:cursor-grabbing select-none flex items-center justify-center text-center ${
                                draggedId === form.id ? 'ring-2 ring-primary/30 shadow-md' : ''
                            }`}
                            style={{ backgroundColor: brandColor, color: '#fff' }}
                        >
                            <span className="truncate block">{form.title || 'Untitled Form'}</span>
                        </div>
                    </Draggable>
                );
            })}
        </div>
    );
}
