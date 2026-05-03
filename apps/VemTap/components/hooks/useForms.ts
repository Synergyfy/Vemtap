import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '../../lib/api';
import type { Form, FormSubmission, CreateFormDto } from '../types/form';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:3005/api/v1');

export const formsApi = {
  getForm: async (qrCodeId: string): Promise<Form> => {
    const { data } = await axios.get(`${API_URL}/forms/${qrCodeId}`, { withCredentials: true });
    return data;
  },
  createOrUpdateForm: async (dto: CreateFormDto): Promise<Form> => {
    const { data } = await axios.post(`${API_URL}/forms`, dto, { withCredentials: true });
    return data;
  },
  getSubmissions: async (qrCodeId: string): Promise<FormSubmission[]> => {
    const { data } = await axios.get(`${API_URL}/forms/${qrCodeId}/submissions`, { withCredentials: true });
    return data;
  },
  getPublicForm: async (shortId: string): Promise<Form> => {
    return api.get(`/qr-thrive/public/forms/${shortId}`);
  },
  submitForm: async (shortId: string, answers: Record<string, any>): Promise<any> => {
    return api.post(`/qr-thrive/public/forms/${shortId}/submit`, { answers });
  },
  deleteSubmission: async (qrCodeId: string, submissionId: string): Promise<any> => {
    const { data } = await axios.delete(`${API_URL}/forms/${qrCodeId}/submissions/${submissionId}`, { withCredentials: true });
    return data;
  }
};

export const useForm = (qrCodeId?: string) => {
  return useQuery({
    queryKey: ['form', qrCodeId],
    queryFn: () => formsApi.getForm(qrCodeId!),
    enabled: !!qrCodeId,
  });
};

export const useCreateOrUpdateForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFormDto) => formsApi.createOrUpdateForm(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form', data.qrCodeId] });
      toast.success('Form saved successfully');
    },
    onError: () => {
      toast.error('Failed to save form');
    }
  });
};

export const useFormSubmissions = (qrCodeId?: string) => {
  return useQuery({
    queryKey: ['submissions', qrCodeId],
    queryFn: () => formsApi.getSubmissions(qrCodeId!),
    enabled: !!qrCodeId,
  });
};

export const usePublicForm = (shortId?: string) => {
  return useQuery({
    queryKey: ['publicForm', shortId],
    queryFn: () => formsApi.getPublicForm(shortId!),
    enabled: !!shortId,
  });
};

export const useSubmitForm = (shortId: string) => {
  return useMutation({
    mutationFn: (answers: Record<string, any>) => formsApi.submitForm(shortId, answers),
    onSuccess: () => {
      toast.success('Form submitted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit form';
      toast.error(message);
    }
  });
};
