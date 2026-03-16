'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

export default function SocialsPreviewPage() {
    const {
        engagementSettings,
        getBusinessConfig,
        customSuccessMessage,
        customRewardMessage,
        hasRewardSetup,
    } = useCustomerFlowStore();

    const config = getBusinessConfig();

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Socials Preview"
                description="Preview how social and review actions appear after submission."
            />

            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest">Preview</span>
                <span>Socials</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href="/dashboard/settings/engagement/previews/default"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Default Form
                </Link>
                <span className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">Socials</span>
                <Link
                    href="/dashboard/settings/engagement/previews/forms"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Selected Form
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Quick Actions</p>
                        <h3 className="text-lg font-bold text-text-main">Edit Social Settings</h3>
                        <p className="text-xs text-text-secondary">
                            Update social links, review prompts, and post-submit engagement behavior.
                        </p>
                        <Link
                            href="/dashboard/settings/engagement/socials"
                            className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest"
                        >
                            Edit Socials
                        </Link>
                    </div>
                </div>

                <div className="sticky top-6">
                    <details open className="rounded-2xl border border-gray-100 bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                            Preview
                            <span className="text-[10px] font-semibold text-gray-400">Social Actions</span>
                        </summary>
                        <div className="px-4 pb-4">
                            <PhoneFrame title="Socials Preview">
                                <div className="p-6">
                                    <StepOutcome
                                        config={config}
                                        customSuccessMessage={customSuccessMessage}
                                        customRewardMessage={customRewardMessage}
                                        hasRewardSetup={hasRewardSetup}
                                        isDownloading={false}
                                        onDownload={() => { }}
                                        onFinish={() => { }}
                                        onRestart={() => { }}
                                        engagementSettings={engagementSettings}
                                        selectedFormTitle="Feedback Form"
                                        selectedFormType="Form"
                                    />
                                </div>
                            </PhoneFrame>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
