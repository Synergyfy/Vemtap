'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Play } from 'lucide-react';
import { notify } from '@/lib/notify';
import Modal from '@/components/ui/Modal';
import type { SudoAction } from './mockControlTowerData';

type SudoActionPanelProps = {
    title: string;
    subtitle: string;
    subjectLabel: 'Business UID' | 'Customer UID';
    subjectUid: string;
    ticketId: string;
    actions: SudoAction[];
};

export default function SudoActionPanel({
    title,
    subtitle,
    subjectLabel,
    subjectUid,
    ticketId,
    actions,
}: SudoActionPanelProps) {
    const [runningKey, setRunningKey] = useState<string | null>(null);
    const [activeAction, setActiveAction] = useState<SudoAction | null>(null);

    const runAction = async (action: SudoAction, formData: FormData) => {
        setRunningKey(action.key);
        await new Promise((resolve) => setTimeout(resolve, 450));
        const payloadPreview = Array.from(formData.entries())
            .filter(([key]) => key !== 'subject_uid' && key !== 'ticket_ref')
            .map(([key, value]) => `${key}=${String(value)}`)
            .join(', ');
        notify.success(`Mock sudo action executed: ${action.label} (${subjectUid}${ticketId ? `, ticket: ${ticketId}` : ''}${payloadPreview ? `, ${payloadPreview}` : ''})`);
        setRunningKey(null);
        setActiveAction(null);
    };

    const actionForms: Record<string, { title: string; fields: Array<{ name: string; label: string; type: 'text' | 'email' | 'number' | 'textarea'; placeholder: string }> }> = {
        add_user: {
            title: 'Create Business User',
            fields: [
                { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@business.com' },
                { name: 'role', label: 'Role', type: 'text', placeholder: 'Manager' },
            ],
        },
        send_message: {
            title: 'Send Message',
            fields: [
                { name: 'channel', label: 'Channel', type: 'text', placeholder: 'WhatsApp / SMS / Email' },
                { name: 'audience', label: 'Audience', type: 'text', placeholder: 'All returning users' },
                { name: 'content', label: 'Message Content', type: 'textarea', placeholder: 'Type message content...' },
            ],
        },
        add_device: {
            title: 'Register NFC Device',
            fields: [
                { name: 'device_name', label: 'Device Name', type: 'text', placeholder: 'Front Desk Terminal' },
                { name: 'nfc_uid', label: 'NFC UID', type: 'text', placeholder: 'NFC-23D0-AC11' },
                { name: 'branch', label: 'Branch', type: 'text', placeholder: 'Main Branch' },
            ],
        },
        adjust_loyalty: {
            title: 'Adjust Loyalty Rule',
            fields: [
                { name: 'rule_name', label: 'Rule Name', type: 'text', placeholder: 'Signup bonus' },
                { name: 'points', label: 'Points', type: 'number', placeholder: '50' },
                { name: 'note', label: 'Support Note', type: 'textarea', placeholder: 'Reason for override' },
            ],
        },
        resolve_ticket: {
            title: 'Resolve Complaint',
            fields: [
                { name: 'resolution', label: 'Resolution Summary', type: 'textarea', placeholder: 'Describe the fix applied...' },
                { name: 'operator_note', label: 'Admin Note', type: 'textarea', placeholder: 'Any follow-up instructions' },
            ],
        },
        add_profile: {
            title: 'Create Customer Profile',
            fields: [
                { name: 'customer_name', label: 'Customer Name', type: 'text', placeholder: 'John Smith' },
                { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 555 111 2222' },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'john@email.com' },
            ],
        },
        award_points: {
            title: 'Award Points',
            fields: [
                { name: 'points', label: 'Points', type: 'number', placeholder: '120' },
                { name: 'reason', label: 'Reason', type: 'text', placeholder: 'Missed sync compensation' },
                { name: 'note', label: 'Admin Note', type: 'textarea', placeholder: 'Additional context' },
            ],
        },
        redeem_fix: {
            title: 'Fix Redemption',
            fields: [
                { name: 'reward_name', label: 'Reward Name', type: 'text', placeholder: 'Free Latte' },
                { name: 'adjustment', label: 'Adjustment', type: 'text', placeholder: 'Re-credit 80 points' },
                { name: 'note', label: 'Admin Note', type: 'textarea', placeholder: 'Root cause / next step' },
            ],
        },
        update_contact: {
            title: 'Update Customer Contact',
            fields: [
                { name: 'new_phone', label: 'New Phone', type: 'text', placeholder: '+1 555 000 1234' },
                { name: 'new_email', label: 'New Email', type: 'email', placeholder: 'updated@email.com' },
                { name: 'verification_note', label: 'Verification Note', type: 'textarea', placeholder: 'How identity was verified' },
            ],
        },
        close_issue: {
            title: 'Close Support Case',
            fields: [
                { name: 'outcome', label: 'Outcome', type: 'textarea', placeholder: 'Issue resolved details...' },
                { name: 'follow_up', label: 'Follow-up', type: 'text', placeholder: 'No follow-up needed' },
            ],
        },
    };

    const activeForm = activeAction ? actionForms[activeAction.key] : null;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeAction) return;
        const formData = new FormData(event.currentTarget);
        formData.set('subject_uid', subjectUid);
        formData.set('ticket_ref', ticketId);
        await runAction(activeAction, formData);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-display font-bold text-text-main">{title}</h2>
            <p className="text-xs text-text-secondary font-medium mt-1">{subtitle}</p>
            <p className="text-[11px] text-text-secondary font-bold mt-2">{subjectLabel}: <span className="text-text-main">{subjectUid || '-'}</span></p>
            <p className="text-[11px] text-text-secondary font-bold mb-4">Ticket Ref: <span className="text-text-main">{ticketId || '-'}</span></p>

            <div className="space-y-2">
                {actions.map((action) => (
                    <div key={action.key} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-text-main">{action.label}</p>
                            <p className="text-xs text-text-secondary">{action.description}</p>
                        </div>
                        <button
                            onClick={() => setActiveAction(action)}
                            disabled={runningKey !== null}
                            className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-60 flex items-center gap-1.5"
                        >
                            {runningKey === action.key ? <CheckCircle2 size={14} /> : <Play size={14} />}
                            Open Action Form
                        </button>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={!!activeAction}
                onClose={() => setActiveAction(null)}
                title={activeForm?.title || 'Run Sudo Action'}
                description={`Mock admin override for ${subjectLabel.toLowerCase()}: ${subjectUid || '-'}`}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Subject UID</label>
                            <input
                                readOnly
                                value={subjectUid}
                                className="mt-1 w-full h-10 px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Ticket Ref</label>
                            <input
                                readOnly
                                value={ticketId || '-'}
                                className="mt-1 w-full h-10 px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {activeForm?.fields.map((field) => (
                        <div key={field.name}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    required
                                    rows={3}
                                    placeholder={field.placeholder}
                                    className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            ) : (
                                <input
                                    name={field.name}
                                    type={field.type}
                                    required
                                    placeholder={field.placeholder}
                                    className="mt-1 w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setActiveAction(null)}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-text-secondary text-sm font-bold hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={runningKey !== null}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover disabled:opacity-60"
                        >
                            {runningKey ? 'Processing...' : 'Run Mock Sudo Action'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
