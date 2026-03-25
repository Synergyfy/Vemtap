import { useEffect } from 'react';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { useAuthStore } from '@/store/useAuthStore';

export const useMessagingBranch = () => {
    const user = useAuthStore((state) => state.user);
    const isCustomer = user?.role?.toLowerCase() === 'customer';
    const { activeBranchId, setActiveBranch } = useActiveBranch();
    const { data: branches = [] } = useBranches();

    useEffect(() => {
        if (isCustomer) return;
        if (activeBranchId || branches.length === 0) return;

        const mainBranch = branches.find((branch) => branch.isMainBranch) || branches[0];
        if (mainBranch?.id) {
            setActiveBranch(mainBranch.id);
        }
    }, [activeBranchId, branches, isCustomer, setActiveBranch]);

    const branchId = isCustomer
        ? undefined
        : (activeBranchId || branches.find((branch) => branch.isMainBranch)?.id || branches[0]?.id);

    return { branchId, isCustomer };
};
