import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { RedemptionVerifier } from '@/components/loyalty/admin/RedemptionVerifier';

export default function RedemptionVerifyPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader
                title="Terminal Verifier"
                description="Scan or enter customer reward codes for instant validation"
            />

            <div className="py-12">
                <RedemptionVerifier />
            </div>
        </div>
    );
}
