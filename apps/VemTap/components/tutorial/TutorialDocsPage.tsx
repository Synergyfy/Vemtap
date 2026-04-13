'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react';

type Page = { id: string; title: string; path: string; summary: string };
type Section = { id: string; title: string; pages: Page[] };
type Category = { id: string; title: string; sections: Section[] };

const DOCS: Category[] = [
  {
    id: 'core',
    title: 'Core Dashboard',
    sections: [
      {
        id: 'overview',
        title: 'Overview & Analytics',
        pages: [
          { id: 'dashboard-home', title: 'Dashboard Home', path: '/dashboard', summary: 'Main KPIs, charts, quick actions.' },
          { id: 'analytics', title: 'Analytics', path: '/dashboard/analytics', summary: 'High-level business performance.' },
          { id: 'analytics-footfall', title: 'Footfall', path: '/dashboard/analytics/footfall', summary: 'Traffic volume trends.' },
          { id: 'analytics-peak-times', title: 'Peak Times', path: '/dashboard/analytics/peak-times', summary: 'Best and worst operating hours.' },
        ],
      },
      {
        id: 'visitors',
        title: 'Visitors',
        pages: [
          { id: 'visitors-overview', title: 'Visitors', path: '/dashboard/visitors', summary: 'Visitor list and actions.' },
          { id: 'visitors-all', title: 'All Visitors', path: '/dashboard/visitors/all', summary: 'Full history and export.' },
          { id: 'visitors-new', title: 'New Visitors', path: '/dashboard/visitors/new', summary: 'First-time visitors segment.' },
          { id: 'visitors-returning', title: 'Returning Visitors', path: '/dashboard/visitors/returning', summary: 'Retention segment.' },
          { id: 'visitor-profile', title: 'Visitor Profile', path: '/dashboard/visitors/[id]', summary: 'Per-visitor timeline.' },
        ],
      },
    ],
  },
  {
    id: 'engagement',
    title: 'Engagement & Growth',
    sections: [
      {
        id: 'forms',
        title: 'Forms',
        pages: [
          { id: 'forms', title: 'Forms Hub', path: '/dashboard/forms', summary: 'Default form and share links.' },
          { id: 'form-builder', title: 'Form Creator', path: '/dashboard/engagement/forms', summary: 'Build and publish branch forms.' },
          { id: 'form-responses', title: 'Form Responses', path: '/dashboard/engagement/forms/responses', summary: 'Response metrics by form.' },
          { id: 'form-response-detail', title: 'Response Detail', path: '/dashboard/engagement/forms/responses/[formId]', summary: 'Deep inspection for one form.' },
        ],
      },
      {
        id: 'messaging',
        title: 'Channels',
        pages: [
          { id: 'messaging', title: 'Channels', path: '/dashboard/messaging', summary: 'Campaign command center.' },
          { id: 'messaging-compose', title: 'Compose', path: '/dashboard/messaging/compose', summary: 'Create campaigns with form links.' },
          { id: 'messaging-history', title: 'History', path: '/dashboard/messaging/history', summary: 'Sent campaigns and outcomes.' },
          { id: 'messaging-sms', title: 'SMS', path: '/dashboard/messaging/sms', summary: 'SMS flows, templates, settings.' },
          { id: 'messaging-whatsapp', title: 'WhatsApp', path: '/dashboard/messaging/whatsapp', summary: 'WhatsApp campaigns and templates.' },
          { id: 'messaging-email', title: 'Email', path: '/dashboard/messaging/email', summary: 'Email campaigns and templates.' },
        ],
      },
      {
        id: 'loyalty',
        title: 'Loyalty & Automations',
        pages: [
          { id: 'loyalty-overview', title: 'Loyalty', path: '/dashboard/loyalty', summary: 'Program performance and setup.' },
          { id: 'loyalty-customers', title: 'Loyalty Customers', path: '/dashboard/loyalty/customers', summary: 'Member segmentation.' },
          { id: 'loyalty-rewards', title: 'Loyalty Rewards', path: '/dashboard/loyalty/rewards', summary: 'Rewards and thresholds.' },
          { id: 'automations', title: 'Automations', path: '/dashboard/automations', summary: 'Rules and triggers.' },
          { id: 'automation-logs', title: 'Automation Logs', path: '/dashboard/automations/logs', summary: 'Execution traces and failures.' },
          { id: 'automation-performance', title: 'Automation Performance', path: '/dashboard/automations/performance', summary: 'Automation outcome metrics.' },
        ],
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    sections: [
      {
        id: 'devices',
        title: 'Devices & Tap',
        pages: [
          { id: 'devices', title: 'Devices', path: '/dashboard/devices', summary: 'Device list and status.' },
          { id: 'device-detail', title: 'Device Detail', path: '/dashboard/devices/[id]', summary: 'Configure single device behavior.' },
          { id: 'business-link', title: 'Business Link', path: '/dashboard/business-link', summary: 'Tap routing and branch targeting.' },
          { id: 'explore-qrthrive', title: 'Explore QRThrive', path: '/dashboard/explore-qrthrive', summary: 'Discover the synergy between Vemtap and QRThrive.' },
          { id: 'hardware', title: 'Hardware', path: '/dashboard/hardware', summary: 'Hardware deployment and readiness.' },
        ],
      },
      {
        id: 'team',
        title: 'Team & Support',
        pages: [
          { id: 'staff', title: 'Staff', path: '/dashboard/staff', summary: 'Users, roles, and permissions.' },
          { id: 'support', title: 'Support', path: '/dashboard/support', summary: 'Support operations and responses.' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Business Settings',
    sections: [
      {
        id: 'profile',
        title: 'Profile & Structure',
        pages: [
          { id: 'settings-home', title: 'Settings', path: '/dashboard/settings', summary: 'Settings entry and module map.' },
          { id: 'settings-profile', title: 'Profile', path: '/dashboard/settings/profile', summary: 'Brand identity and business details.' },
          { id: 'settings-branches', title: 'Branches', path: '/dashboard/settings/branches', summary: 'Branch configuration.' },
        ],
      },
      {
        id: 'engagement-settings',
        title: 'Engagement Settings',
        pages: [
          { id: 'settings-engagement', title: 'Engagement', path: '/dashboard/engagement', summary: 'Engagement control center.' },
          { id: 'settings-socials', title: 'Socials', path: '/dashboard/engagement/socials', summary: 'Social destination links.' },
        ],
      },
      {
        id: 'platform',
        title: 'Platform',
        pages: [
          { id: 'settings-devices', title: 'Device Settings', path: '/dashboard/settings/devices', summary: 'Global device behavior defaults.' },
          { id: 'settings-integrations', title: 'Integrations', path: '/dashboard/settings/integrations', summary: 'Third-party connections.' },
          { id: 'settings-privacy', title: 'Privacy', path: '/dashboard/settings/privacy', summary: 'Consent and privacy controls.' },
          { id: 'settings-subscription', title: 'Subscription', path: '/dashboard/settings/subscription', summary: 'Plan and billing management.' },
        ],
      },
    ],
  },
];

const firstPage = DOCS[0].sections[0].pages[0];

function stepsFor(page: Page) {
  return [
    `Open ${page.title} from the sidebar route ${page.path}.`,
    `Configure and review the ${page.summary.toLowerCase()}.`,
    'Validate results in analytics, history, or related dashboard modules.',
  ];
}

export default function TutorialDocsPage({ title = 'Business Docs' }: { title?: string }) {
  const [query, setQuery] = useState('');
  const [activePageId, setActivePageId] = useState(firstPage.id);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(Object.fromEntries(DOCS.map((c) => [c.id, true])));
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(DOCS.flatMap((c) => c.sections.map((s) => [s.id, true])))
  );

  const all = useMemo(
    () => DOCS.flatMap((cat) => cat.sections.flatMap((sec) => sec.pages.map((page) => ({ cat, sec, page })))),
    []
  );

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase();
    if (!key) return all;
    return all.filter((i) => `${i.cat.title} ${i.sec.title} ${i.page.title} ${i.page.path} ${i.page.summary}`.toLowerCase().includes(key));
  }, [all, query]);

  const active = useMemo(() => filtered.find((i) => i.page.id === activePageId) || filtered[0], [activePageId, filtered]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Business Docs</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main">{title}</h1>
          <p className="text-sm text-text-secondary mt-2">Structured tutorial with dropdown modules for the entire business dashboard.</p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 h-11 flex items-center gap-2">
            <Search size={14} className="text-text-secondary" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search modules or routes..." className="w-full bg-transparent text-sm outline-none" />
          </div>
          <p className="text-[11px] text-text-secondary mt-2">{filtered.length} pages documented</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-5 max-h-[80vh] overflow-auto">
              {DOCS.map((cat) => {
                if (!filtered.some((i) => i.cat.id === cat.id)) return null;
                return (
                  <div key={cat.id} className="mb-2">
                    <button onClick={() => setOpenCats((p) => ({ ...p, [cat.id]: !p[cat.id] }))} className="w-full h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-text-main">{cat.title}</span>
                      {openCats[cat.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {openCats[cat.id] && (
                      <div className="mt-2 space-y-1">
                        {cat.sections.map((sec) => {
                          if (!filtered.some((i) => i.sec.id === sec.id)) return null;
                          return (
                            <div key={sec.id} className="border border-slate-200 rounded-xl p-1">
                              <button onClick={() => setOpenSections((p) => ({ ...p, [sec.id]: !p[sec.id] }))} className="w-full h-9 px-2 rounded-lg hover:bg-slate-50 flex items-center justify-between">
                                <span className="text-xs font-black text-text-main">{sec.title}</span>
                                {openSections[sec.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </button>
                              {openSections[sec.id] && (
                                <div className="space-y-1 pb-1">
                                  {sec.pages
                                    .filter((page) => filtered.some((i) => i.page.id === page.id))
                                    .map((page) => (
                                      <button
                                        key={page.id}
                                        onClick={() => setActivePageId(page.id)}
                                        className={`w-full text-left px-2 py-2 rounded-lg text-xs ${active?.page.id === page.id ? 'bg-primary/10 text-primary font-black' : 'text-text-secondary hover:bg-slate-50'}`}
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

          <main className="lg:col-span-8 xl:col-span-9">
            {!active ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-text-secondary">No docs match your search.</div>
            ) : (
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  {active.cat.title} / {active.sec.title}
                </p>
                <div className="flex items-center justify-between gap-3 mt-2">
                  <h2 className="text-2xl font-display font-black text-text-main">{active.page.title}</h2>
                  <Link href={active.page.path} className="inline-flex items-center gap-1 text-xs font-black text-primary">
                    Open Page <ExternalLink size={12} />
                  </Link>
                </div>
                <p className="text-sm text-text-secondary mt-2">{active.page.summary}</p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Route</p>
                  <code className="text-sm font-black text-text-main">{active.page.path}</code>
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {stepsFor(active.page).map((step, index) => (
                    <div key={`${active.page.id}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Step {index + 1}</p>
                      <p className="text-sm text-text-main mt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

