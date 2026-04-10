import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    BusinessControlRecord,
    CustomerControlRecord,
    BusinessSudoActionDto,
    CustomerSudoActionDto,
    SudoActionResponse,
    ControlTowerSearchFilter,
} from './types';

export const useControlTowerBusinesses = (filter: ControlTowerSearchFilter) => {
    return useQuery<BusinessControlRecord[], Error>({
        queryKey: ['control-tower', 'businesses', filter],
        queryFn: async () => {
            const q = new URLSearchParams();
            if (filter.query) q.set('query', filter.query);
            if (filter.limit) q.set('limit', String(filter.limit));
            return await api.get(`/admin/control-tower/businesses?${q.toString()}`);
        },

    });
};

export const useControlTowerCustomers = (filter: ControlTowerSearchFilter) => {
    return useQuery<CustomerControlRecord[], Error>({
        queryKey: ['control-tower', 'customers', filter],
        queryFn: async () => {
            const q = new URLSearchParams();
            if (filter.query) q.set('query', filter.query);
            if (filter.limit) q.set('limit', String(filter.limit));
            return await api.get(`/admin/control-tower/customers?${q.toString()}`);
        },

    });
};

export const useExecuteBusinessSudoAction = () => {
    return useMutation<SudoActionResponse, Error, BusinessSudoActionDto>({
        mutationFn: async (dto) => {
            return await api.post('/admin/control-tower/businesses/sudo', dto);
        },
    });
};

export const useExecuteCustomerSudoAction = () => {
    return useMutation<SudoActionResponse, Error, CustomerSudoActionDto>({
        mutationFn: async (dto) => {
            return await api.post('/admin/control-tower/customers/sudo', dto);
        },
    });
};
