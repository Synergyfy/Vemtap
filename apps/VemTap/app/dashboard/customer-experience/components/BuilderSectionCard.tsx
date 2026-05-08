'use client';

import React, { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BuilderSectionCardProps {
    id: string;
    title: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    onEditClick?: () => void;
    isEditing?: boolean;
    editValue?: string;
    onEditValueChange?: (val: string) => void;
    onSaveEdit?: () => void;
    onCancelEdit?: () => void;
    editLabel?: string;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
    accentColor?: string;
    dragHandleProps?: any;
    showDragHandle?: boolean;
    onFocus?: () => void;
}

export function BuilderSectionCard({
    id,
    title,
    subtitle,
    icon,
    enabled,
    onToggle,
    onEditClick,
    isEditing = false,
    editValue = '',
    onEditValueChange,
    onSaveEdit,
    onCancelEdit,
    editLabel = 'Edit',
    children,
    defaultExpanded = false,
    accentColor = 'primary',
    dragHandleProps,
    showDragHandle = true,
    onFocus,
}: BuilderSectionCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const hasContent = !!children;

    return (
        <div
            onClick={onFocus}
            className={cn(
                'bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200',
                expanded && hasContent ? 'border-primary/40 shadow-md' : 'border-gray-100 hover:border-gray-200'
            )}
        >
            {/* Header Row */}
            <div
                className={cn(
                    'flex items-center gap-3 px-4 py-3.5 transition-colors',
                    expanded && hasContent ? 'bg-primary/[0.03]' : 'bg-white'
                )}
            >
                {/* Drag Handle */}
                {showDragHandle && (
                    <div
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                    >
                        <GripVertical size={16} />
                    </div>
                )}

                {/* Icon */}
                <div className={cn(
                    'size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    enabled ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                )}>
                    {icon}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => onEditValueChange?.(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveEdit?.();
                                    if (e.key === 'Escape') onCancelEdit?.();
                                }}
                                className="w-full text-sm font-bold border border-primary/40 rounded px-2 py-0.5 outline-none focus:ring-2 ring-primary/20 bg-white text-gray-900"
                            />
                            <button onClick={onSaveEdit} className="text-primary hover:text-primary/80 transition-colors"><Check size={16} /></button>
                            <button onClick={onCancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
                        </div>
                    ) : (
                        <>
                            <h3 className={cn(
                                'text-sm font-bold leading-tight',
                                enabled ? 'text-gray-900' : 'text-gray-400'
                            )}>{title}</h3>
                            {subtitle && (
                                <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">{subtitle}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                        onClick={() => onToggle(!enabled)}
                        className={cn(
                            'relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0',
                            enabled ? 'bg-primary' : 'bg-gray-200'
                        )}
                    >
                        <div className={cn(
                            'absolute top-[2px] size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
                            enabled ? 'translate-x-[20px]' : 'translate-x-[2px]'
                        )} />
                    </button>

                    {/* Edit Button */}
                    {onEditClick && !isEditing && (
                        <button
                            onClick={onEditClick}
                            className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all"
                        >
                            {editLabel}
                        </button>
                    )}

                    {/* Expand/Collapse */}
                    {hasContent && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                        >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {expanded && hasContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
