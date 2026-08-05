'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, Plus, Search, Globe, Map as MapIcon, Store, Building2, Layers, QrCode, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cluster, ClusterType } from '@/lib/api/clusters';

interface TreeNode {
    cluster: Cluster;
    children: TreeNode[];
}

interface ClusterTreeProps {
    clusters: Cluster[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
}

const TYPE_ICONS: Record<ClusterType, React.ComponentType<{ size?: number | string; className?: string }>> = {
    country: Globe,
    state: MapIcon,
    market: Store,
    building: Building2,
    custom: Layers,
};

const TYPE_COLORS: Record<ClusterType, { bg: string; text: string }> = {
    country: { bg: 'bg-sky-50', text: 'text-sky-600' },
    state: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    market: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    building: { bg: 'bg-amber-50', text: 'text-amber-600' },
    custom: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const buildTree = (clusters: Cluster[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    clusters.forEach(c => {
        map.set(c.id, { cluster: c, children: [] });
    });

    clusters.forEach(c => {
        const node = map.get(c.id)!;
        if (c.parentId && map.has(c.parentId)) {
            map.get(c.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes
        .map(node => {
            const children = filterTree(node.children, query);
            const matches = node.cluster.name.toLowerCase().includes(q) ||
                (node.cluster.state || '').toLowerCase().includes(q) ||
                (node.cluster.city || '').toLowerCase().includes(q);
            if (matches || children.length > 0) {
                return { ...node, children: matches ? node.children : children };
            }
            return null;
        })
        .filter((n): n is TreeNode => n !== null);
};

function TreeNodeRow({
    node,
    depth,
    selectedId,
    onSelect,
    expandedIds,
    toggleExpand,
}: {
    node: TreeNode;
    depth: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.cluster.id);
    const isSelected = node.cluster.id === selectedId;
    const c = node.cluster;
    const Icon = TYPE_ICONS[c.type];
    const colors = TYPE_COLORS[c.type];
    const totalDeals = c.autoMatchedOffersCount + c.pinnedOffersCount;

    return (
        <div>
            <div
                onClick={() => onSelect(c.id)}
                className={cn(
                    "group flex items-center gap-2 py-2 px-2 rounded-xl cursor-pointer transition-all text-sm",
                    isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-gray-50 text-text-main"
                )}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }}
                        className={cn(
                            "p-0.5 rounded-md transition-all shrink-0",
                            isSelected ? "hover:bg-white/20" : "hover:bg-gray-100"
                        )}
                    >
                        <ChevronRight
                            size={12}
                            className={cn("transition-transform", isExpanded && "rotate-90")}
                        />
                    </button>
                ) : (
                    <div className="w-4 shrink-0" />
                )}

                <div className={cn(
                    "size-5 rounded-md flex items-center justify-center shrink-0",
                    isSelected ? "bg-white/20" : colors.bg
                )}>
                    <Icon size={11} className={cn(isSelected ? "text-white" : colors.text)} />
                </div>

                <span className="font-semibold truncate flex-1">{c.name}</span>

                <div className={cn(
                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shrink-0 opacity-70",
                    isSelected ? "text-white" : "text-gray-400"
                )}>
                    <span>{totalDeals}</span>
                    <span className={cn(isSelected ? "text-white/40" : "text-gray-300")}>|</span>
                    <QrCode size={8} />
                    <span>{c.qrCodesCount}</span>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div style={{ paddingLeft: depth * 12 + 16 }}>
                    {node.children.map(child => (
                        <TreeNodeRow
                            key={child.cluster.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ClusterTree({ clusters, selectedId, onSelect, onAdd }: ClusterTreeProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const ids = new Set<string>();
        clusters.forEach(c => { if (c.parentId) ids.add(c.parentId); });
        return ids;
    });

    const tree = useMemo(() => {
        const fullTree = buildTree(clusters);
        return searchQuery ? filterTree(fullTree, searchQuery) : fullTree;
    }, [clusters, searchQuery]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const totalDeals = clusters.reduce((sum, c) => sum + c.autoMatchedOffersCount + c.pinnedOffersCount, 0);

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-sm font-black text-text-main">Market Hierarchy</h2>
                        <p className="text-[10px] font-bold text-text-secondary mt-0.5">
                            {clusters.length} clusters · {totalDeals} deals
                        </p>
                    </div>
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-sm transition-all"
                    >
                        <Plus size={12} />
                        Add
                    </button>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search clusters or areas…"
                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {tree.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="size-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                            <Sparkles size={24} />
                        </div>
                        <p className="text-xs font-bold text-gray-400">
                            {searchQuery ? 'No matches found.' : 'No clusters yet.'}
                        </p>
                    </div>
                ) : (
                    tree.map(node => (
                        <TreeNodeRow
                            key={node.cluster.id}
                            node={node}
                            depth={0}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
