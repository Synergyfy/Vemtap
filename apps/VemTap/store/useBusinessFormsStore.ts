import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PredefinedBusinessFormType = 'survey' | 'complaint' | 'social';
export type BusinessFormType = PredefinedBusinessFormType | 'custom';
export type BusinessFormStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type FormFieldType = 'short_text' | 'long_text' | 'choice' | 'rating' | 'url' | 'email' | 'phone';
export type SubmissionStatus = 'new' | 'in_review' | 'responded' | 'closed';
export type ResponseChannel = 'sms' | 'whatsapp' | 'email';
export type ResponseActor = 'bot' | 'agent';

export interface BusinessFormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  isRequired?: boolean;
  order?: number;
  options?: string[];
}

export interface BusinessForm {
  id: string;
  businessId: string;
  businessName: string;
  type: BusinessFormType;
  typeLabel?: string;
  title: string;
  key: string;
  status: BusinessFormStatus;
  fields: BusinessFormField[];
  responseChannels: ResponseChannel[];
  responseActor: ResponseActor;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  businessId: string;
  formType: BusinessFormType;
  formTitle: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  answers: Record<string, unknown>;
  status: SubmissionStatus;
  createdAt: string;
  response?: {
    channel: ResponseChannel;
    actor: ResponseActor;
    message: string;
    respondedAt: string;
    responderName?: string;
  };
}

interface CreateBusinessFormInput {
  businessId: string;
  businessName: string;
  type: BusinessFormType;
  typeLabel?: string;
  title: string;
  key: string;
  fields: BusinessFormField[];
  responseChannels: ResponseChannel[];
  responseActor: ResponseActor;
}

interface CreateSubmissionInput {
  formId: string;
  businessId: string;
  formType: BusinessFormType;
  formTitle: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  answers: Record<string, unknown>;
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  type: BusinessFormType;
  typeLabel?: string;
  fields: BusinessFormField[];
  isSystem: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface FormTemplateStats {
  templateId: string;
  templateName: string;
  usageCount: number;
  totalResponses: number;
  uniqueBranchesCount: number;
  uniqueBusinessesCount: number;
  usage: Array<{
    formId: string;
    branchName: string;
    businessName: string;
    responseCount: number;
  }>;
}

export interface BusinessFormsState {
  forms: BusinessForm[];
  submissions: FormSubmission[];
  templates: FormTemplate[];
  templateStats: Record<string, FormTemplateStats>;
  customTypeOptionsByBusiness: Record<string, string[]>;
  adminForms: any[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  createForm: (input: CreateBusinessFormInput) => Promise<BusinessForm>;
  updateForm: (id: string, updates: Partial<BusinessForm>) => Promise<void>;
  setFormStatus: (id: string, status: BusinessFormStatus, reviewedBy?: string, reviewNote?: string) => Promise<void>;
  submitForm: (input: CreateSubmissionInput) => Promise<FormSubmission>;
  setSubmissionStatus: (id: string, status: SubmissionStatus) => Promise<void>;
  respondToSubmission: (
    id: string,
    payload: { channel: ResponseChannel; actor: ResponseActor; message: string; responderName?: string }
  ) => Promise<void>;
  addCustomTypeOption: (businessId: string, label: string) => void;
  removeCustomTypeOption: (businessId: string, label: string) => void;

  // Admin Forms Management
  fetchAdminForms: () => Promise<void>;
  disableForm: (id: string) => Promise<void>;
  enableForm: (id: string) => Promise<void>;

  fetchForms: (businessId: string) => Promise<void>;
  fetchSubmissions: (businessId: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchTemplateStats: () => Promise<void>;
  createTemplate: (template: Omit<FormTemplate, 'id' | 'createdAt'>) => Promise<FormTemplate>;
  updateTemplate: (id: string, updates: Partial<FormTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (templateId: string, branchId: string) => Promise<void>;
}

const nowIso = () => new Date().toISOString();

const slugifyKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

const ensureUniqueKey = (candidate: string, existing: BusinessForm[]) => {
  let key = slugifyKey(candidate);
  if (!key) key = `form-${Date.now().toString(36)}`;
  if (!existing.some((form) => form.key === key)) return key;

  let suffix = 2;
  while (existing.some((form) => form.key === `${key}-${suffix}`)) {
    suffix += 1;
  }
  return `${key}-${suffix}`;
};



const mapFrontendToBackendType = (type: string): string => {
  switch (type) {
    case 'short_text': return 'text';
    case 'long_text': return 'textarea';
    case 'choice': return 'select';
    case 'rating': return 'text'; // Fallback
    case 'email':
    case 'phone':
    case 'url':
      return 'text';
    default: return 'text';
  }
};

const mapBackendToFrontendType = (type: string): FormFieldType => {
  switch (type) {
    case 'text': return 'short_text';
    case 'textarea': return 'long_text';
    case 'select': return 'choice';
    case 'radio':
    case 'checkbox':
      return 'choice';
    default: return 'short_text';
  }
};

export const useBusinessFormsStore = create<BusinessFormsState>()(
  persist(
    (set, get) => ({
      forms: [],
      submissions: [],
      templates: [],
      templateStats: {},
      customTypeOptionsByBusiness: {},
      adminForms: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchTemplateStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          const response = await adminFormsApi.getTemplatesStats();
          const statsMap: Record<string, FormTemplateStats> = {};
          (response || []).forEach((s: any) => {
            statsMap[s.templateId] = s;
          });
          set({ templateStats: statsMap, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      fetchAdminForms: async () => {
        set({ isLoading: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          const response = await adminFormsApi.getBusinessForms();
          set({ adminForms: response.items || response, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      disableForm: async (id: string) => {
        set({ isSubmitting: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          await adminFormsApi.disableBusinessForm(id);
          set((state) => ({
            adminForms: state.adminForms.map((f: any) =>
               f.id === id ? { ...f, adminDisabled: true } : f
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      enableForm: async (id: string) => {
        set({ isSubmitting: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          await adminFormsApi.enableBusinessForm(id);
          set((state) => ({
            adminForms: state.adminForms.map((f: any) =>
              f.id === id ? { ...f, adminDisabled: false } : f
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      createForm: async (input) => {
        set({ isSubmitting: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          const response = await api.post('/business-forms', input);
          const form: BusinessForm = {
            ...response,
            status: response.isActive ? 'approved' : 'pending'
          };
          set((state) => ({ forms: [form, ...state.forms], isSubmitting: false }));
          return form;
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      updateForm: async (id, updates) => {
        set({ isSubmitting: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          const response = await api.patch(`/business-forms/${id}`, updates);
          set((state) => ({
            forms: state.forms.map((form) =>
              form.id === id ? { ...form, ...response, updatedAt: nowIso() } : form
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      setFormStatus: async (id, status, reviewedBy, reviewNote) => {
        set({ isSubmitting: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          // Assuming PATCH /business-forms/:id handles status updates
          const response = await api.patch(`/business-forms/${id}`, { isActive: status === 'approved' });
          set((state) => ({
            forms: state.forms.map((form) =>
              form.id === id
                ? {
                  ...form,
                  status,
                  reviewedAt: nowIso(),
                  reviewedBy,
                  reviewNote,
                  updatedAt: nowIso()
                }
                : form
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      submitForm: async (input) => {
        set({ isSubmitting: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          let response;
          try {
            response = await api.post(`/visitor-forms/code/${input.formId}/responses`, input.answers);
          } catch {
            response = await api.post(`/visitor-forms/${input.formId}/responses`, input.answers);
          }
          const submission: FormSubmission = {
            id: response.id,
            formId: input.formId,
            businessId: input.businessId,
            formType: input.formType,
            formTitle: input.formTitle,
            customerName: input.customerName.trim() || 'Anonymous',
            customerEmail: input.customerEmail?.trim(),
            customerPhone: input.customerPhone?.trim(),
            answers: input.answers,
            status: 'new',
            createdAt: nowIso()
          };
          set((state) => ({ submissions: [submission, ...state.submissions], isSubmitting: false }));
          return submission;
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      setSubmissionStatus: async (id, status) => {
        set({ isSubmitting: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          // Assuming an endpoint exists for this - if not, we update locally but wait for next fetch
          // await api.patch(`/forms/submissions/${id}`, { status });
          set((state) => ({
            submissions: state.submissions.map((submission) =>
              submission.id === id ? { ...submission, status } : submission
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      respondToSubmission: async (id, payload) => {
        set({ isSubmitting: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          // Assuming an endpoint exists for this
          // await api.post(`/forms/submissions/${id}/respond`, payload);
          set((state) => ({
            submissions: state.submissions.map((submission) =>
              submission.id === id
                ? {
                  ...submission,
                  status: 'responded',
                  response: {
                    ...payload,
                    respondedAt: nowIso()
                  }
                }
                : submission
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      addCustomTypeOption: (businessId, label) =>
        set((state) => {
          const normalized = label.trim();
          if (!normalized) return state;
          const existing = state.customTypeOptionsByBusiness[businessId] || [];
          if (existing.some((item) => item.toLowerCase() === normalized.toLowerCase())) return state;
          return {
            customTypeOptionsByBusiness: {
              ...state.customTypeOptionsByBusiness,
              [businessId]: [...existing, normalized]
            }
          };
        }),
      removeCustomTypeOption: (businessId, label) =>
        set((state) => {
          const existing = state.customTypeOptionsByBusiness[businessId] || [];
          return {
            customTypeOptionsByBusiness: {
              ...state.customTypeOptionsByBusiness,
              [businessId]: existing.filter((item) => item !== label)
            }
          };
        }),
      fetchForms: async (businessId) => {
        set({ isLoading: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          const url = businessId ? `/business-forms?businessId=${businessId}` : '/business-forms';
          const response = await api.get(url);
          const items = response || [];

          const forms: BusinessForm[] = items.map((item: any) => ({
            id: item.id,
            businessId: item.businessId,
            businessName: item.businessName || 'Business',
            type: item.type || 'survey',
            typeLabel: item.typeLabel,
            title: item.title,
            key: item.key,
            status: item.isActive ? 'approved' : 'pending',
            fields: item.fields?.map((f: any) => ({
              id: f.id,
              label: f.question,
              type: mapBackendToFrontendType(f.type),
              required: f.isRequired,
              isRequired: f.isRequired,
              order: f.order,
              options: f.options
            })) || [],
            responseChannels: item.responseChannels || ['email'],
            responseActor: item.responseActor || 'agent',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));

          set({ forms, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      fetchSubmissions: async (businessId) => {
        set({ isLoading: true, error: null });
        try {
          const { api } = await import('@/lib/api');
          const forms = get().forms;
          const allSubmissions: FormSubmission[] = [];

          for (const form of forms) {
            try {
              const response = await api.get(`/business-forms/${form.id}/responses`);
              const items = response || [];
              const submissions: FormSubmission[] = items.map((item: any) => ({
                id: item.id,
                formId: form.id,
                businessId: form.businessId,
                formType: form.type,
                formTitle: form.title,
                customerName: item.customerName || 'Anonymous',
                customerEmail: item.customerEmail,
                customerPhone: item.customerPhone,
                answers: item.answers,
                status: item.status || 'new',
                createdAt: item.createdAt,
                response: item.response
              }));
              allSubmissions.push(...submissions);
            } catch (err) {
              console.error(`Failed to fetch responses for form ${form.id}:`, err);
            }
          }

          set({ submissions: allSubmissions, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      createTemplate: async (input) => {
        set({ isSubmitting: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          const payload = {
            name: input.title,
            description: input.description,
            fields: input.fields.map((f, index) => ({
              type: mapFrontendToBackendType(f.type),
              question: f.label,
              options: f.options,
              isRequired: f.required || f.isRequired || false,
              order: f.order ?? index
            }))
          };

          const response = await adminFormsApi.createTemplate(payload);

          const newTemplate: FormTemplate = {
            id: response.id,
            title: response.name,
            description: response.description,
            type: input.type, // Map from input as backend doesn't store 'type' at top level in entity seen
            fields: response.fields.map((f: any) => ({
              id: f.id,
              label: f.question,
              type: mapBackendToFrontendType(f.type),
              required: f.isRequired,
              isRequired: f.isRequired,
              order: f.order,
              options: f.options
            })),
            isSystem: input.isSystem,
            isActive: response.isActive,
            createdAt: response.createdAt
          };

          set((state) => ({
            templates: [newTemplate, ...state.templates],
            isSubmitting: false
          }));
          return newTemplate;
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      deleteTemplate: async (id) => {
        set({ isSubmitting: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          await adminFormsApi.deleteTemplate(id);
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          const response = await adminFormsApi.getTemplates();
          const items = response.items || [];

          const templates: FormTemplate[] = items.map((item: any) => ({
            id: item.id,
            title: item.name,
            description: item.description,
            type: 'custom', // Default type for fetched
            fields: item.fields?.map((f: any) => ({
              id: f.id,
              label: f.question,
              type: mapBackendToFrontendType(f.type),
              required: f.isRequired,
              isRequired: f.isRequired,
              order: f.order,
              options: f.options
            })) || [],
            isSystem: false,
            isActive: item.isActive,
            createdAt: item.createdAt
          }));

          set({ templates, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      updateTemplate: async (id, updates) => {
        set({ isSubmitting: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          const payload: any = {};
          if (updates.title) payload.name = updates.title;
          if (updates.description) payload.description = updates.description;
          if (updates.fields) {
            payload.fields = updates.fields.map((f, index) => ({
              type: mapFrontendToBackendType(f.type),
              question: f.label,
              options: f.options,
              isRequired: f.required || f.isRequired || false,
              order: f.order ?? index
            }));
          }

          const response = await adminFormsApi.updateTemplate(id, payload);

          set((state) => ({
            templates: state.templates.map((t) =>
              t.id === id ? {
                ...t,
                title: response.name || t.title,
                description: response.description || t.description,
                fields: response.fields?.map((f: any) => ({
                  id: f.id,
                  label: f.question,
                  type: mapBackendToFrontendType(f.type),
                  required: f.isRequired,
                  isRequired: f.isRequired,
                  order: f.order,
                  options: f.options
                })) || t.fields,
                isActive: response.isActive ?? t.isActive
              } : t
            ),
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      },
      useTemplate: async (templateId, branchId) => {
        set({ isSubmitting: true, error: null });
        try {
          const { adminFormsApi } = await import('@/lib/api/admin');
          await adminFormsApi.useTemplate(templateId, branchId);
          set({ isSubmitting: false });
        } catch (error: any) {
          set({ error: error.message, isSubmitting: false });
          throw error;
        }
      }
    }),
    {
      name: 'business-forms-storage-v1'
    }
  )
);

export const formsSelectors = {
  byBusiness: (businessId?: string) => (state: BusinessFormsState) =>
    state.forms.filter((f) => !businessId || f.businessId === businessId),
  approvedByBusiness: (businessId?: string) => (state: BusinessFormsState) =>
    state.forms.filter((f) => (!businessId || f.businessId === businessId) && f.status === 'approved'),
  submissionsByBusiness: (businessId?: string) => (state: BusinessFormsState) =>
    state.submissions.filter((s) => !businessId || s.businessId === businessId),
  pendingForms: (state: BusinessFormsState) => state.forms.filter((f) => f.status === 'pending')
};
