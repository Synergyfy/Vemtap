import AgentSidebar from '@/components/agent/AgentSidebar';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    return (
        <AgentSidebar>
            {children}
        </AgentSidebar>
    );
}
