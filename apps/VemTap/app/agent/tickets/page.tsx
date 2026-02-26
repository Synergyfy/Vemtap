'use client';

import AgentTicketsTable from '@/components/agent/AgentTicketsTable';

export default function AgentTicketsPage() {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Agent Tickets</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Support Tickets</h1>
                <p className="text-text-secondary text-sm font-medium">Review, update, and respond to assigned tickets.</p>
            </div>
            <AgentTicketsTable />
        </div>
    );
}
