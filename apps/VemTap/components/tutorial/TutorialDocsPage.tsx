'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ExternalLink, Search, BookOpen, ArrowRight, Lightbulb, Zap } from 'lucide-react';
import { useKnowledgeBaseStore } from '@/store/useKnowledgeBaseStore';
import type { ContentBlock } from '@/constants/knowledgeBaseDocs';

export default function TutorialDocsPage({ title = 'Knowledge Base' }: { title?: string }) {
  const docs = useKnowledgeBaseStore((s) => s.docs);
  const [query, setQuery] = useState('');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const firstPage = docs[0]?.sections[0]?.pages[0];

  useEffect(() => {
    if (docs.length && !activePageId) {
      setActivePageId(firstPage?.id ?? null);
      setOpenCat(docs[0].id);
      setOpenSection(docs[0]?.sections[0]?.id ?? null);
    }
  }, [docs, activePageId, firstPage?.id]);

  const all = useMemo(
    () => docs.flatMap((cat) => cat.sections.flatMap((sec) => sec.pages.map((page) => ({ cat, sec, page })))),
    [docs]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('path');
    if (!path) return;
    const match =
      all.find((i) => i.page.path === path) ||
      [...all].sort((a, b) => b.page.path.length - a.page.path.length).find((i) => path.startsWith(i.page.path));
    if (match) {
      setActivePageId(match.page.id);
      setOpenCat(match.cat.id);
      setOpenSection(match.sec.id);
      window.scrollTo({ top: 0 });
    }
  }, [all]);

  const pageSearchText = (page: { id: string; title: string; path: string; summary: string; blocks: ContentBlock[]; tips?: string[] }) =>
    `${page.title} ${page.path} ${page.summary} ${page.blocks
      .map((b) => (b.type === 'steps' ? b.items.join(' ') : b.type === 'image' ? b.caption ?? '' : b.text))
      .join(' ')} ${(page.tips ?? []).join(' ')}`;

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase();
    if (!key) return all;
    return all.filter((i) => `${i.cat.title} ${i.sec.title} ${pageSearchText(i.page)}`.toLowerCase().includes(key));
  }, [all, query]);

  const active = useMemo(() => filtered.find((i) => i.page.id === activePageId) || filtered[0], [activePageId, filtered]);

  const renderBlocks = (blocks: ContentBlock[]) => (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h3 key={i} className="text-base font-bold text-gray-900 mt-4">
                {block.text}
              </h3>
            );
          case 'text':
            return (
              <p key={i} className="text-sm text-gray-600 leading-relaxed mb-2">
                {block.text}
              </p>
            );
          case 'steps':
            return (
              <div key={i} className="space-y-3">
                {block.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 ml-1">
                    <div className="size-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-black">{j + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{item}</p>
                  </div>
                ))}
              </div>
            );
          case 'image':
            return (
              <figure key={i} className="my-4">
                <img
                  src={block.url}
                  alt={block.caption || 'Article image'}
                  className="w-full max-h-[420px] object-contain rounded-xl border border-gray-100 bg-gray-50"
                />
                {block.caption && (
                  <figcaption className="text-center text-xs text-gray-400 mt-2">{block.caption}</figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );

  if (!docs.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-12 text-center">
            <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-500">The Knowledge Base is empty.</p>
            <p className="text-xs text-gray-400 mt-1">Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center ring-1 ring-blue-100">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Documentation</p>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
            Everything you need to know about using your business dashboard. Search for a topic or browse by category.
          </p>
          <div className="mt-5 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[12px] font-semibold text-gray-400">{filtered.length} articles</span>
            <span className="text-gray-200">|</span>
            <span className="text-[12px] font-semibold text-gray-400">{docs.length} categories</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 lg:sticky lg:top-5 max-h-[80vh] overflow-y-auto">
              {docs.map((cat) => {
                if (!filtered.some((i) => i.cat.id === cat.id)) return null;
                return (
                  <div key={cat.id} className="mb-1.5">
                    <button
                      onClick={() => setOpenCat((prev) => prev === cat.id ? null : cat.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{cat.title}</span>
                      {openCat === cat.id ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                    </button>
                    {openCat === cat.id && (
                      <div className="ml-1 space-y-0.5 mt-0.5">
                        {cat.sections.map((sec) => {
                          if (!filtered.some((i) => i.sec.id === sec.id)) return null;
                          return (
                            <div key={sec.id} className="border-l-2 border-gray-100 ml-3 pl-3 py-1">
                              <button
                                onClick={() => setOpenSection((prev) => prev === sec.id ? null : sec.id)}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">{sec.title}</span>
                                {openSection === sec.id ? (
                                  <ChevronDown size={11} className="text-gray-300" />
                                ) : (
                                  <ChevronRight size={11} className="text-gray-300" />
                                )}
                              </button>
                                {openSection === sec.id && (
                                <div className="space-y-0.5 mt-0.5">
                                  {sec.pages
                                    .filter((page) => filtered.some((i) => i.page.id === page.id))
                                    .map((page) => (
                                      <button
                                        key={page.id}
                                        onClick={() => {
                                          setActivePageId(page.id);
                                          setOpenCat(cat.id);
                                          setOpenSection(sec.id);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                                          active?.page.id === page.id
                                            ? 'bg-blue-50 text-blue-700 font-bold'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                      >
                                        {page.title}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-8 xl:col-span-9">
            {!active ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-12 text-center">
                <Search size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-500">No articles match your search.</p>
                <p className="text-xs text-gray-400 mt-1">Try a different keyword or browse the categories.</p>
              </div>
            ) : (
              <article className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Breadcrumb & Title */}
                <div className="p-6 sm:p-8 pb-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 mb-1">
                    <span>{active.cat.title}</span>
                    <ChevronRight size={10} />
                    <span>{active.sec.title}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{active.page.title}</h2>
                      <p className="text-sm text-gray-500 mt-2 max-w-2xl">{active.page.summary}</p>
                    </div>
                    <Link
                      href={active.page.path}
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-[13px] font-bold hover:bg-blue-100 transition-colors shrink-0"
                    >
                      Open Page <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8">
                  {active.page.thumbnail && (
                    <img
                      src={active.page.thumbnail}
                      alt={active.page.title}
                      className="w-full max-h-72 object-cover rounded-xl border border-gray-100 mb-6"
                    />
                  )}
                  <div className="prose prose-gray max-w-none">
                    {renderBlocks(active.page.blocks)}
                  </div>

                  {/* Tips */}
                  {active.page.tips && active.page.tips.length > 0 && (
                    <div className="mt-8 p-5 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-amber-600" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Tips</span>
                      </div>
                      <ul className="space-y-2">
                        {active.page.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-amber-800">
                            <ArrowRight size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between">
                  <Link
                    href={active.page.path}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Go to {active.page.title} <ExternalLink size={13} />
                  </Link>
                  {firstPage && active.page.id !== firstPage.id && (
                    <span className="text-[11px] text-gray-400">
                      Article ID: {active.page.id}
                    </span>
                  )}
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
