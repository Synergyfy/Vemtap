import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest } from './types';

export const useSurvey = () => {
    return useQuery<Survey, Error>({
        queryKey: ['survey'],
        queryFn: async () => {
            const data = await api.get('/surveys');
            return data;
        },
    });
};

export const useCreateOrUpdateSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation<Survey, Error, CreateSurveyRequest>({
        mutationFn: async (data: CreateSurveyRequest) => {
            return await api.post('/surveys', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey'] });
        },
    });
};

export const usePatchSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation<Survey, Error, UpdateSurveyRequest>({
        mutationFn: async (data: UpdateSurveyRequest) => {
            return await api.patch('/surveys', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey'] });
        },
    });
};
