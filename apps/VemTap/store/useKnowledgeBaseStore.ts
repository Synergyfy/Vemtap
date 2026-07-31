import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeedDocs, type KBCategory, type KBPage } from '@/constants/knowledgeBaseDocs';

export function createDefaultPage(): KBPage {
    return {
        id: `page-${Date.now()}`,
        title: 'New Article',
        path: '/dashboard',
        summary: '',
        blocks: [{ type: 'text', text: '' }],
        tips: [],
    };
}

interface KnowledgeBaseState {
    docs: KBCategory[];
    addCategory: (title: string) => string;
    updateCategory: (catId: string, title: string) => void;
    deleteCategory: (catId: string) => void;
    addSection: (catId: string, title: string) => string;
    updateSection: (catId: string, secId: string, title: string) => void;
    deleteSection: (catId: string, secId: string) => void;
    addPage: (catId: string, secId: string) => string;
    updatePage: (catId: string, secId: string, pageId: string, page: Partial<KBPage>) => void;
    deletePage: (catId: string, secId: string, pageId: string) => void;
    movePage: (catId: string, secId: string, pageId: string, dir: -1 | 1) => void;
    resetDocs: () => void;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
    persist(
        (set) => ({
            docs: buildSeedDocs(),

            addCategory: (title) => {
                const id = `cat-${Date.now()}`;
                set((s) => ({ docs: [...s.docs, { id, title, sections: [] }] }));
                return id;
            },

            updateCategory: (catId, title) =>
                set((s) => ({
                    docs: s.docs.map((c) => (c.id === catId ? { ...c, title } : c)),
                })),

            deleteCategory: (catId) =>
                set((s) => ({ docs: s.docs.filter((c) => c.id !== catId) })),

            addSection: (catId, title) => {
                const id = `sec-${Date.now()}`;
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId ? { ...c, sections: [...c.sections, { id, title, pages: [] }] } : c
                    ),
                }));
                return id;
            },

            updateSection: (catId, secId, title) =>
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId
                            ? {
                                  ...c,
                                  sections: c.sections.map((sec) => (sec.id === secId ? { ...sec, title } : sec)),
                              }
                            : c
                    ),
                })),

            deleteSection: (catId, secId) =>
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId ? { ...c, sections: c.sections.filter((sec) => sec.id !== secId) } : c
                    ),
                })),

            addPage: (catId, secId) => {
                const page = createDefaultPage();
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId
                            ? {
                                  ...c,
                                  sections: c.sections.map((sec) =>
                                      sec.id === secId ? { ...sec, pages: [...sec.pages, page] } : sec
                                  ),
                              }
                            : c
                    ),
                }));
                return page.id;
            },

            updatePage: (catId, secId, pageId, page) =>
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId
                            ? {
                                  ...c,
                                  sections: c.sections.map((sec) =>
                                      sec.id === secId
                                          ? {
                                                ...sec,
                                                pages: sec.pages.map((p) => (p.id === pageId ? { ...p, ...page } : p)),
                                            }
                                          : sec
                                  ),
                              }
                            : c
                    ),
                })),

            deletePage: (catId, secId, pageId) =>
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId
                            ? {
                                  ...c,
                                  sections: c.sections.map((sec) =>
                                      sec.id === secId
                                          ? { ...sec, pages: sec.pages.filter((p) => p.id !== pageId) }
                                          : sec
                                  ),
                              }
                            : c
                    ),
                })),

            movePage: (catId, secId, pageId, dir) =>
                set((s) => ({
                    docs: s.docs.map((c) =>
                        c.id === catId
                            ? {
                                  ...c,
                                  sections: c.sections.map((sec) => {
                                      if (sec.id !== secId) return sec;
                                      const idx = sec.pages.findIndex((p) => p.id === pageId);
                                      const to = idx + dir;
                                      if (idx < 0 || to < 0 || to >= sec.pages.length) return sec;
                                      const pages = [...sec.pages];
                                      const [moved] = pages.splice(idx, 1);
                                      pages.splice(to, 0, moved);
                                      return { ...sec, pages };
                                  }),
                              }
                            : c
                    ),
                })),

            resetDocs: () => set({ docs: buildSeedDocs() }),
        }),
        { name: 'knowledge-base-storage' }
    )
);
