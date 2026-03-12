import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminPricingPlans, fetchPricingPlans, addPricingPlan, updatePricingPlan, deletePricingPlan } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';
import { notify } from '@/lib/notify';

export const useAdminPricingPlans = () => {
    return useQuery<PricingPlan[], Error>({
        queryKey: ['admin-pricing-plans'],
        queryFn: fetchAdminPricingPlans,
    });
};

export const usePricingPlans = () => {
    return useQuery<PricingPlan[], Error>({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans,
    });
};

export const useAddPricingPlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addPricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            notify.success('New plan added successfully');
        },
        onError: (error: any) => {
            notify.error(error.message || 'Failed to add new plan');
        },
    });
};

export const useUpdatePricingPlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            notify.success('Pricing plan updated successfully');
        },
        onError: (error: any) => {
            notify.error(error.message || 'Failed to update pricing plan');
        },
    });
};

export const useDeletePricingPlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            notify.success('Plan deleted successfully');
        },
        onError: (error: any) => {
            notify.error(error.message || 'Failed to delete plan');
        },
    });
};
