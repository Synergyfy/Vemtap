'use client';

import AgentChatDesk from '@/components/agent/AgentChatDesk';

export default function AgentSupportPage() {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Agent Support</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Support Chat</h1>
                <p className="text-text-secondary text-sm font-medium">Respond to assigned chat requests from customers and businesses.</p>
            </div>
            <AgentChatDesk />
        </div>
    );
}
