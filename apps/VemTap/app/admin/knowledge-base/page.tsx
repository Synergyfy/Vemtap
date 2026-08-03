'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, Trash2, Save, MoveUp, MoveDown, BookOpen, Folder, FileText,
    ChevronDown, ChevronRight, ImagePlus, X, Heading, ListOrdered,
    Type, RotateCcw, ExternalLink, FolderPlus, FilePlus2, Pencil, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { ContentBlock } from '@/constants/knowledgeBaseDocs';
import {
    useKnowledgeBaseTree,
    useKnowledgeBasePage,
    useCreateKbCategory,
    useUpdateKbCategory,
    useDeleteKbCategory,
    useCreateKbSection,
    useUpdateKbSection,
    useDeleteKbSection,
    useCreateKbPage,
    useUpdateKbPage,
    useDeleteKbPage,
    type KnowledgeBaseTreeCategory,
    type KnowledgeBaseTreeSection,
    type KnowledgeBasePage,
} from '@/services/knowledge-base/hooks';

type Selection =
    | { type: 'cat'; catId: string }
    | { type: 'sec'; catId: string; secId: string }
    | { type: 'page'; catId: string; secId: string; pageId: string }
    | null;

const BLOCK_TYPES: { type: ContentBlock['type']; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; default: ContentBlock }[] = [
    { type: 'heading', label: 'Heading', icon: Heading, default: { type: 'heading', text: 'New Heading' } },
    { type: 'text', label: 'Text', icon: Type, default: { type: 'text', text: '' } },
    { type: 'steps', label: 'Steps', icon: ListOrdered, default: { type: 'steps', items: [''] } },
    { type: 'image', label: 'Image', icon: ImagePlus, default: { type: 'image', url: '', caption: '' } },
];

const BLOCK_LABELS: Record<ContentBlock['type'], string> = {
    heading: 'Heading',
    text: 'Text',
    steps: 'Steps',
    image: 'Image',
};

const BLOCK_ICONS: Record<ContentBlock['type'], React.ComponentType<{ size?: number; className?: string }>> = {
    heading: Heading,
    text: Type,
    steps: ListOrdered,
    image: ImagePlus,
};

const inputCls = 'w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all';
const textareaCls = 'w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all';
const labelCls = 'text-[10px] font-black uppercase tracking-widest text-text-secondary';
const iconBtn = 'size-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed';

function UploadField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFile = async (file: File) => {
        try {
            toast.loading('Uploading image...', { id: 'kb-upload' });
            const url = await uploadToCloudinary(file);
            toast.success('Image uploaded', { id: 'kb-upload' });
            onChange(url);
        } catch {
            toast.error('Upload failed', { id: 'kb-upload' });
        }
    };
    return (
        <div>
            <div className="flex items-center gap-3">
                {value ? (
                    <img src={value} alt={label} className="h-16 w-16 rounded-xl object-cover border border-gray-100 bg-white" />
                ) : (
                    <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-300">
                        <ImageIcon size={20} />
                    </div>
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all w-fit"
                    >
                        <ImagePlus size={12} />
                        Upload Image
                    </button>
                    <input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="...or paste an image URL"
                        className="h-9 bg-gray-50 border border-gray-100 rounded-lg px-3 text-xs font-medium text-gray-600 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}

function PageEditor({ pageId, catId, secId, onDeleted }: {
    pageId: string;
    catId: string;
    secId: string;
    onDeleted: () => void;
}) {
    const { data: fullPage } = useKnowledgeBasePage(pageId);
    const { mutate: saveMutation } = useUpdateKbPage();
    const [draft, setDraft] = useState<KnowledgeBasePage | null>(null);
    const lastLoaded = useRef<string>('');

    useEffect(() => {
        if (!fullPage) return;
        const sig = JSON.stringify(fullPage);
        if (sig !== lastLoaded.current) {
            lastLoaded.current = sig;
            setDraft(JSON.parse(JSON.stringify(fullPage)));
        }
    }, [fullPage]);

    if (!draft) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
                <BookOpen size={32} className="mx-auto text-gray-300 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-gray-500">Loading article...</p>
            </div>
        );
    }

    const set = <K extends keyof KnowledgeBasePage>(key: K, value: KnowledgeBasePage[K]) =>
        setDraft((d): KnowledgeBasePage => ({ ...d!, [key]: value }));

    const updateBlock = (i: number, patch: Partial<ContentBlock>) =>
        setDraft((d): KnowledgeBasePage => ({
            ...d!,
            blocks: d!.blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as ContentBlock) : b)),
        }));

    const addBlock = (type: ContentBlock['type']) => {
        const template = BLOCK_TYPES.find((t) => t.type === type)!;
        setDraft((d): KnowledgeBasePage => ({ ...d!, blocks: [...d!.blocks, JSON.parse(JSON.stringify(template.default))] }));
    };

    const moveBlock = (i: number, dir: -1 | 1) =>
        setDraft((d): KnowledgeBasePage => {
            const blocks = [...d!.blocks];
            const to = i + dir;
            if (to < 0 || to >= blocks.length) return d!;
            const [moved] = blocks.splice(i, 1);
            blocks.splice(to, 0, moved);
            return { ...d!, blocks };
        });

    const removeBlock = (i: number) =>
        setDraft((d): KnowledgeBasePage => ({ ...d!, blocks: d!.blocks.filter((_, j) => j !== i) }));

    const handleSave = () => {
        saveMutation({
            id: pageId,
            dto: {
                title: draft.title,
                path: draft.path,
                summary: draft.summary ?? '',
                thumbnail: draft.thumbnail,
                blocks: draft.blocks,
                tips: draft.tips ?? [],
                order: draft.order,
                categoryId: draft.categoryId ?? catId,
                sectionId: draft.sectionId ?? secId,
            },
        }, {
            onSuccess: () => toast.success('Article saved'),
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to save article'),
        });
    };

    const handleDiscard = () => {
        if (fullPage) setDraft(JSON.parse(JSON.stringify(fullPage)));
        toast('Changes discarded');
    };

    return (
        <div className="space-y-5">
            {/* Details */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-text-main">Article Details</h3>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">ID: {draft.id}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Title</label>
                        <input className={cn(inputCls, 'mt-1.5')} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Article title" />
                    </div>
                    <div>
                        <label className={labelCls}>Dashboard Path</label>
                        <input className={cn(inputCls, 'mt-1.5')} value={draft.path} onChange={(e) => set('path', e.target.value)} placeholder="/dashboard/..." />
                    </div>
                </div>
                <div>
                    <label className={labelCls}>Summary</label>
                    <textarea rows={2} className={cn(textareaCls, 'mt-1.5')} value={draft.summary ?? ''} onChange={(e) => set('summary', e.target.value)} placeholder="Short summary shown under the article title" />
                </div>
                <div>
                    <label className={labelCls}>Thumbnail</label>
                    <div className="mt-1.5">
                        <UploadField value={draft.thumbnail ?? ''} onChange={(url) => set('thumbnail', url)} label="Thumbnail" />
                    </div>
                </div>
            </section>

            {/* Blocks */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-text-main">Article Content</h3>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{draft.blocks.length} blocks</span>
                </div>

                <div className="space-y-3">
                    {draft.blocks.map((block, i) => {
                        const Icon = BLOCK_ICONS[block.type];
                        return (
                            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        <Icon size={12} className="text-primary" />
                                        {BLOCK_LABELS[block.type]} — #{i + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className={cn(iconBtn, 'text-gray-400 hover:bg-white hover:text-gray-700')} title="Move up">
                                            <MoveUp size={13} />
                                        </button>
                                        <button onClick={() => moveBlock(i, 1)} disabled={i === draft.blocks.length - 1} className={cn(iconBtn, 'text-gray-400 hover:bg-white hover:text-gray-700')} title="Move down">
                                            <MoveDown size={13} />
                                        </button>
                                        <button onClick={() => removeBlock(i)} className={cn(iconBtn, 'text-red-400 hover:bg-red-50 hover:text-red-600')} title="Delete block">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {block.type === 'heading' && (
                                    <input
                                        className={cn(inputCls, 'h-10')}
                                        value={block.text}
                                        onChange={(e) => updateBlock(i, { text: e.target.value })}
                                        placeholder="Heading text"
                                    />
                                )}

                                {block.type === 'text' && (
                                    <textarea
                                        rows={3}
                                        className={textareaCls}
                                        value={block.text}
                                        onChange={(e) => updateBlock(i, { text: e.target.value })}
                                        placeholder="Write a paragraph..."
                                    />
                                )}

                                {block.type === 'steps' && (
                                    <div className="space-y-2">
                                        {block.items.map((item, j) => (
                                            <div key={j} className="flex items-center gap-2">
                                                <span className="size-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black">{j + 1}</span>
                                                <input
                                                    className={cn(inputCls, 'h-10')}
                                                    value={item}
                                                    onChange={(e) => updateBlock(i, { items: block.items.map((it, k) => (k === j ? e.target.value : it)) })}
                                                    placeholder={`Step ${j + 1}`}
                                                />
                                                {block.items.length > 1 && (
                                                    <button
                                                        onClick={() => updateBlock(i, { items: block.items.filter((_, k) => k !== j) })}
                                                        className="size-8 shrink-0 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => updateBlock(i, { items: [...block.items, ''] })}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-gray-300 text-gray-500 text-[11px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all"
                                        >
                                            <Plus size={11} /> Add Step
                                        </button>
                                    </div>
                                )}

                                {block.type === 'image' && (
                                    <div className="space-y-3">
                                        <UploadField
                                            value={block.url}
                                            onChange={(url) => updateBlock(i, { url })}
                                            label="Article image"
                                        />
                                        <input
                                            className={cn(inputCls, 'h-10')}
                                            value={block.caption ?? ''}
                                            onChange={(e) => updateBlock(i, { caption: e.target.value })}
                                            placeholder="Image caption (optional)"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                    {BLOCK_TYPES.map((t) => (
                        <button
                            key={t.type}
                            onClick={() => addBlock(t.type)}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-dashed border-gray-300 text-gray-500 text-[11px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                        >
                            <t.icon size={12} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Tips */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-text-main">Tips</h3>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{draft.tips?.length ?? 0} tips</span>
                </div>
                <div className="space-y-2">
                    {(draft.tips ?? []).map((tip, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                className={cn(inputCls, 'h-10')}
                                value={tip}
                                onChange={(e) => set('tips', (draft.tips ?? []).map((t, k) => (k === i ? e.target.value : t)))}
                                placeholder="A helpful tip..."
                            />
                            <button
                                onClick={() => set('tips', (draft.tips ?? []).filter((_, k) => k !== i))}
                                className="size-8 shrink-0 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => set('tips', [...(draft.tips ?? []), ''])}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-gray-300 text-gray-500 text-[11px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all"
                    >
                        <Plus size={11} /> Add Tip
                    </button>
                </div>
            </section>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-3">
                <button
                    onClick={() => { if (window.confirm('Delete this article?')) { onDeleted(); } }}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-red-100 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                    <Trash2 size={13} /> Delete Article
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.open(`/tutorial/bussiness?path=${encodeURIComponent(draft.path)}`, '_blank')}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        <ExternalLink size={13} /> Preview
                    </button>
                    <button
                        onClick={handleDiscard}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        <RotateCcw size={13} /> Discard
                    </button>
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                    >
                        <Save size={13} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminKnowledgeBasePage() {
    const treeQuery = useKnowledgeBaseTree();
    const docs = treeQuery.data?.categories ?? [];

    const { mutate: addCategoryMutation } = useCreateKbCategory();
    const { mutate: updateCategoryMutation } = useUpdateKbCategory();
    const { mutate: deleteCategoryMutation } = useDeleteKbCategory();
    const { mutate: addSectionMutation } = useCreateKbSection();
    const { mutate: updateSectionMutation } = useUpdateKbSection();
    const { mutate: deleteSectionMutation } = useDeleteKbSection();
    const { mutate: addPageMutation } = useCreateKbPage();
    const { mutate: updatePageMutation } = useUpdateKbPage();
    const { mutate: deletePageMutation } = useDeleteKbPage();

    const [selection, setSelection] = useState<Selection>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

    const findContext = (sel: Selection): { cat: KnowledgeBaseTreeCategory; sec?: KnowledgeBaseTreeSection } | null => {
        if (!sel) return null;
        const cat = docs.find((c) => c.id === sel.catId);
        if (!cat) return null;
        if (sel.type === 'cat') return { cat };
        const sec = cat.sections.find((s) => s.id === sel.secId);
        if (!sec) return null;
        return { cat, sec };
    };

    const ctx = findContext(selection);
    const secCtx = ctx && selection?.type === 'sec' ? { cat: ctx.cat, sec: ctx.sec! } : null;
    const pageCtx =
        selection?.type === 'page' && ctx?.sec
            ? { catId: ctx.cat.id, secId: ctx.sec.id, pageId: selection.pageId }
            : null;

    const handleAddCategory = () => {
        addCategoryMutation({ title: 'New Category', order: docs.length }, {
            onSuccess: (created: any) => {
                const id = created?.id;
                if (!id) return;
                setSelection({ type: 'cat', catId: id });
                setExpanded((e) => ({ ...e, [id]: true }));
                toast.success('Category created — rename it in the editor');
            },
        });
    };

    const handleAddSection = (catId: string) => {
        const cat = docs.find((c) => c.id === catId);
        addSectionMutation({ title: 'New Section', categoryId: catId, order: cat?.sections.length ?? 0 }, {
            onSuccess: (created: any) => {
                const id = created?.id;
                if (!id) return;
                setSelection({ type: 'sec', catId, secId: id });
                setExpanded((e) => ({ ...e, [catId]: true, [id]: true }));
                toast.success('Section created — rename it in the editor');
            },
        });
    };

    const handleAddPage = (catId: string, secId: string) => {
        const sec = docs.find((c) => c.id === catId)?.sections.find((s) => s.id === secId);
        addPageMutation({
            title: 'New Article',
            path: `new-article-${Date.now()}`,
            summary: '',
            blocks: [{ type: 'text', text: '' }],
            tips: [],
            categoryId: catId,
            sectionId: secId,
            order: sec?.pages.length ?? 0,
        }, {
            onSuccess: (created: any) => {
                const id = created?.id;
                if (!id) return;
                setSelection({ type: 'page', catId, secId, pageId: id });
                setExpanded((e) => ({ ...e, [catId]: true, [secId]: true }));
                toast.success('Article created — edit it below');
            },
        });
    };

    const handleDeleteCategory = (cat: KnowledgeBaseTreeCategory) => {
        if (!window.confirm(`Delete category "${cat.title}" and everything inside it?`)) return;
        deleteCategoryMutation(cat.id, {
            onSuccess: () => { if (selection?.catId === cat.id) setSelection(null); toast.success('Category deleted'); },
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete category'),
        });
    };

    const handleDeleteSection = (catId: string, sec: KnowledgeBaseTreeSection) => {
        if (!window.confirm(`Delete section "${sec.title}" and all its articles?`)) return;
        deleteSectionMutation(sec.id, {
            onSuccess: () => { if (selection?.type === 'sec' && selection.secId === sec.id) setSelection({ type: 'cat', catId }); toast.success('Section deleted'); },
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete section'),
        });
    };

    const handleDeletePage = (catId: string, secId: string) => {
        if (!selection || selection.type !== 'page') return;
        deletePageMutation(selection.pageId, {
            onSuccess: () => { setSelection({ type: 'sec', catId, secId }); toast.success('Article deleted'); },
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete article'),
        });
    };

    const handleMovePage = (catId: string, secId: string, pageId: string, dir: -1 | 1) => {
        const sec = docs.find((c) => c.id === catId)?.sections.find((s) => s.id === secId);
        const pages = sec?.pages ?? [];
        const idx = pages.findIndex((p) => p.id === pageId);
        const target = pages[idx + dir];
        if (idx < 0 || !target) return;
        updatePageMutation({ id: pageId, dto: { order: target.order ?? idx + dir } });
        updatePageMutation({ id: target.id, dto: { order: pages[idx].order ?? idx } });
        toast.success('Order updated');
    };

    const renameCategory = (id: string, title: string) =>
        updateCategoryMutation({ id, dto: { title } }, {
            onSuccess: () => toast.success('Category renamed'),
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to rename'),
        });

    const renameSection = (id: string, title: string) =>
        updateSectionMutation({ id, dto: { title } }, {
            onSuccess: () => toast.success('Section renamed'),
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to rename'),
        });

    if (treeQuery.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <BookOpen size={32} className="mx-auto text-gray-300 mb-3 animate-pulse" />
                    <p className="text-sm font-semibold text-gray-500">Loading Knowledge Base...</p>
                </div>
            </div>
        );
    }

    if (treeQuery.isError) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
                    <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-text-main">Could not load the Knowledge Base.</p>
                    <p className="text-xs text-text-secondary mt-1">Only admins can manage it. If this persists, try again later.</p>
                    <button
                        onClick={() => treeQuery.refetch()}
                        className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
                    >
                        <RotateCcw size={13} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-text-main">Knowledge Base</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage the business knowledge base — categories, sections, articles, and images.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/tutorial/bussiness"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        <ExternalLink size={13} /> View Site
                    </a>
                    <button
                        onClick={handleAddCategory}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus size={13} /> Add Category
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Tree */}
                <aside className="lg:col-span-4 xl:col-span-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-3 lg:sticky lg:top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        {docs.length === 0 && (
                            <div className="text-center py-10">
                                <BookOpen size={28} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-xs font-semibold text-gray-400">No categories yet. Add one to get started.</p>
                            </div>
                        )}
                        {docs.map((cat) => (
                            <div key={cat.id} className="mb-1.5">
                                <div
                                    className={cn(
                                        'group flex items-center gap-1.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all',
                                        selection?.catId === cat.id && selection.type === 'cat' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'
                                    )}
                                    onClick={() => setSelection({ type: 'cat', catId: cat.id })}
                                >
                                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(cat.id); }} className="text-gray-400 hover:text-gray-700 shrink-0">
                                        {expanded[cat.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <Folder size={13} className="shrink-0 text-amber-500" />
                                    <span className="flex-1 truncate text-[13px] font-bold text-text-main">{cat.title}</span>
                                    <span className="shrink-0 text-[10px] font-bold text-text-secondary bg-gray-100 rounded-full px-1.5 py-0.5">
                                        {cat.sections.reduce((n, s) => n + s.pages.length, 0)}
                                    </span>
                                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAddSection(cat.id); }}
                                            className={cn(iconBtn, 'text-gray-400 hover:bg-primary/10 hover:text-primary')}
                                            title="Add section"
                                        >
                                            <FolderPlus size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelection({ type: 'cat', catId: cat.id }); }}
                                            className={cn(iconBtn, 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}
                                            title="Rename"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                                            className={cn(iconBtn, 'text-gray-400 hover:bg-red-50 hover:text-red-500')}
                                            title="Delete category"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {expanded[cat.id] && (
                                    <div className="ml-3 border-l-2 border-gray-100 pl-2.5 space-y-0.5 mt-0.5">
                                        {cat.sections.map((sec) => (
                                            <div key={sec.id}>
                                                <div
                                                    className={cn(
                                                        'group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all',
                                                        selection?.type === 'sec' && selection.secId === sec.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'
                                                    )}
                                                    onClick={() => setSelection({ type: 'sec', catId: cat.id, secId: sec.id })}
                                                >
                                                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(sec.id); }} className="text-gray-300 hover:text-gray-600 shrink-0">
                                                        {expanded[sec.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                    </button>
                                                    <span className="flex-1 truncate text-[11px] font-black uppercase tracking-wider text-text-secondary">{sec.title}</span>
                                                    <span className="shrink-0 text-[10px] font-bold text-text-secondary bg-gray-100 rounded-full px-1.5 py-0.5">
                                                        {sec.pages.length}
                                                    </span>
                                                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAddPage(cat.id, sec.id); }}
                                                            className={cn(iconBtn, 'text-gray-400 hover:bg-primary/10 hover:text-primary')}
                                                            title="Add article"
                                                        >
                                                            <FilePlus2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelection({ type: 'sec', catId: cat.id, secId: sec.id }); }}
                                                            className={cn(iconBtn, 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}
                                                            title="Rename"
                                                        >
                                                            <Pencil size={11} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteSection(cat.id, sec); }}
                                                            className={cn(iconBtn, 'text-gray-400 hover:bg-red-50 hover:text-red-500')}
                                                            title="Delete section"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {expanded[sec.id] && (
                                                    <div className="ml-2.5 space-y-0.5 mt-0.5">
                                                        {sec.pages.map((page, i) => (
                                                            <div
                                                                key={page.id}
                                                                className={cn(
                                                                    'group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all',
                                                                    selection?.type === 'page' && selection.pageId === page.id
                                                                        ? 'bg-primary/10 text-primary font-bold'
                                                                        : 'hover:bg-gray-50'
                                                                )}
                                                                onClick={() => setSelection({ type: 'page', catId: cat.id, secId: sec.id, pageId: page.id })}
                                                            >
                                                                <FileText size={11} className="shrink-0 text-gray-300" />
                                                                <span className="flex-1 truncate text-[12px] font-medium">{page.title}</span>
                                                                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleMovePage(cat.id, sec.id, page.id, -1); }}
                                                                        disabled={i === 0}
                                                                        className={cn(iconBtn, 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}
                                                                    >
                                                                        <MoveUp size={11} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleMovePage(cat.id, sec.id, page.id, 1); }}
                                                                        disabled={i === sec.pages.length - 1}
                                                                        className={cn(iconBtn, 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}
                                                                    >
                                                                        <MoveDown size={11} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelection({ type: 'page', catId: cat.id, secId: sec.id, pageId: page.id });
                                                                            if (window.confirm(`Delete article "${page.title}"?`)) handleDeletePage(cat.id, sec.id);
                                                                        }}
                                                                        className={cn(iconBtn, 'text-gray-400 hover:bg-red-50 hover:text-red-500')}
                                                                    >
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Editor */}
                <main className="lg:col-span-8 xl:col-span-9 space-y-5">
                    {!ctx && (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                            <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-bold text-text-main">Select an item to edit</p>
                            <p className="text-xs text-text-secondary mt-1">
                                Pick a category, section, or article from the tree — or create a new one.
                            </p>
                        </div>
                    )}

                    {ctx && !ctx.sec && selection?.type === 'cat' && (
                        <div key={ctx.cat.id} className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Folder size={16} className="text-amber-500" />
                                <h3 className="text-sm font-black text-text-main">Category</h3>
                            </div>
                            <div>
                                <label className={labelCls}>Category Name</label>
                                <input
                                    className={cn(inputCls, 'mt-1.5')}
                                    defaultValue={ctx.cat.title}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            renameCategory(ctx.cat.id, (e.target as HTMLInputElement).value);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value !== ctx.cat.title) {
                                            renameCategory(ctx.cat.id, e.target.value);
                                        }
                                    }}
                                    placeholder="Category name"
                                />
                                <p className="text-[11px] text-text-secondary mt-1.5">
                                    {ctx.cat.sections.reduce((n, s) => n + s.pages.length, 0)} articles across {ctx.cat.sections.length} sections. Press Enter or click away to rename.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAddSection(ctx.cat.id)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                                >
                                    <FolderPlus size={13} /> Add Section
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(ctx.cat)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-red-100 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                >
                                    <Trash2 size={13} /> Delete Category
                                </button>
                            </div>
                        </div>
                    )}

                    {secCtx && (
                        <div key={secCtx.sec.id} className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Folder size={16} className="text-blue-500" />
                                <h3 className="text-sm font-black text-text-main">Section</h3>
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">in {secCtx.cat.title}</span>
                            </div>
                            <div>
                                <label className={labelCls}>Section Name</label>
                                <input
                                    className={cn(inputCls, 'mt-1.5')}
                                    defaultValue={secCtx.sec.title}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            renameSection(secCtx.sec.id, (e.target as HTMLInputElement).value);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value !== secCtx.sec.title) {
                                            renameSection(secCtx.sec.id, e.target.value);
                                        }
                                    }}
                                    placeholder="Section name"
                                />
                                <p className="text-[11px] text-text-secondary mt-1.5">
                                    {secCtx.sec.pages.length} articles. Press Enter or click away to rename.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAddPage(secCtx.cat.id, secCtx.sec.id)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                                >
                                    <FilePlus2 size={13} /> Add Article
                                </button>
                                <button
                                    onClick={() => handleDeleteSection(secCtx.cat.id, secCtx.sec)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-red-100 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                >
                                    <Trash2 size={13} /> Delete Section
                                </button>
                            </div>
                        </div>
                    )}

                    {pageCtx && (
                        <PageEditor
                            key={pageCtx.pageId}
                            pageId={pageCtx.pageId}
                            catId={pageCtx.catId}
                            secId={pageCtx.secId}
                            onDeleted={() => handleDeletePage(pageCtx.catId, pageCtx.secId)}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}