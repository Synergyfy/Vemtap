import { useMemo } from 'react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveCodes } from '@/services/qr-thrive/hooks';

export type ValidationStatus = {
    isValid: boolean;
    errors: {
        code: 'MISSING_PROFILE' | 'MISSING_LOGO' | 'MISSING_QR' | 'MISSING_EXPERIENCE' | 'RESTRICTED_PERMISSION' | 'RESTRICTED_SUBSCRIPTION';
        message: string;
        actionLabel: string;
        actionPath: string;
    }[];
};

export function useMarketingAssetValidation() {
    const user = useAuthStore((state) => state.user);
    const { activeBranchId } = useActiveBranch();
    const { data: business } = useMyBusiness(!!user);
    const { data: branches = [] } = useBranches(!!user);
    const { data: qrCodes = [] } = useQrThriveCodes(activeBranchId as string);

    const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];

    return useMemo((): ValidationStatus => {
        const errors: ValidationStatus['errors'] = [];

        // 1. Business Profile Exists
        if (!business) {
            errors.push({
                code: 'MISSING_PROFILE',
                message: 'Complete your business profile before creating Marketing Assets.',
                actionLabel: 'Complete Profile',
                actionPath: '/dashboard/settings/profile'
            });
        }

        // 2. Logo Exists
        const logoUrl = activeBranch?.logoUrl || business?.logoUrl;
        if (!logoUrl) {
            errors.push({
                code: 'MISSING_LOGO',
                message: 'Your business needs a logo to be included in marketing materials.',
                actionLabel: 'Upload Logo',
                actionPath: '/dashboard/settings/profile'
            });
        }

        // 3. Business QR Exists (Check if branch has a unique code or QR codes exist)
        if (!activeBranch?.uniqueCode && qrCodes.length === 0) {
            errors.push({
                code: 'MISSING_QR',
                message: 'Complete your Business QR setup before creating Marketing Assets.',
                actionLabel: 'Setup QR',
                actionPath: '/dashboard/customer-experience'
            });
        }

        // 4. Customer Experience Exists (UBL sequence check)
        const ublSequence = activeBranch?.engagement?.ublSequence || [];
        if (ublSequence.length === 0) {
            errors.push({
                code: 'MISSING_EXPERIENCE',
                message: 'Setup your Customer Experience flow so your QR has a destination.',
                actionLabel: 'Configure Experience',
                actionPath: '/dashboard/customer-experience'
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }, [business, activeBranch, qrCodes]);
}
