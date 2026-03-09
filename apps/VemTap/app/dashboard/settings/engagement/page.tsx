import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import EngagementFeatureCards from '@/components/dashboard/engagement/EngagementFeatureCards';

export default function EngagementSettingsIndexPage() {
    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Engagement Overview"
                description="Manage what happens after a customer submits the default form."
            />

            <EngagementTabs
                tabs={[
                    { label: 'Overview', active: true },
                    { label: 'Socials', href: '/dashboard/settings/engagement/socials' },
                    { label: 'Form Creator', href: '/dashboard/settings/engagement/forms' },
                    { label: 'Form Responses', href: '/dashboard/settings/engagement/forms/responses' },
                    { label: 'Automation', href: '/dashboard/automations' },
                    { label: 'Messaging', href: '/dashboard/messaging/compose' },
                ]}
            />

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Engagement Flow
                </p>
                <p className="text-sm text-blue-900 font-bold mt-2 leading-relaxed">
                    Customer taps NFC, submits default form, then enters your post-submission journey:
                    socials, extra forms, reviews, and follow-up campaigns.
                </p>
            </div>

            <EngagementFeatureCards
                cards={[
                    {
                        eyebrow: 'Setup',
                        title: 'Social links step',
                        description: 'Control if social links appear after default form submission.',
                        href: '/dashboard/settings/engagement/socials',
                        cta: 'Open socials',
                    },
                    {
                        eyebrow: 'Build',
                        title: 'Post-submit forms',
                        description: 'Attach one or more forms that can run after submission.',
                        href: '/dashboard/settings/engagement/forms',
                        cta: 'Open form creator',
                    },
                    {
                        eyebrow: 'Track',
                        title: 'Response management',
                        description: 'Review and manage all customer responses in one place.',
                        href: '/dashboard/settings/engagement/forms/responses',
                        cta: 'Open responses',
                    },
                ]}
            />
        </div>
    );
}
