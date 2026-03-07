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
  createdAt: string;
}

interface BusinessFormsState {
  forms: BusinessForm[];
  submissions: FormSubmission[];
  templates: FormTemplate[];
  customTypeOptionsByBusiness: Record<string, string[]>;
  createForm: (input: CreateBusinessFormInput) => BusinessForm;
  updateForm: (id: string, updates: Partial<BusinessForm>) => void;
  setFormStatus: (id: string, status: BusinessFormStatus, reviewedBy?: string, reviewNote?: string) => void;
  submitForm: (input: CreateSubmissionInput) => FormSubmission;
  setSubmissionStatus: (id: string, status: SubmissionStatus) => void;
  respondToSubmission: (
    id: string,
    payload: { channel: ResponseChannel; actor: ResponseActor; message: string; responderName?: string }
  ) => void;
  addCustomTypeOption: (businessId: string, label: string) => void;
  removeCustomTypeOption: (businessId: string, label: string) => void;
  createTemplate: (template: Omit<FormTemplate, 'id' | 'createdAt'>) => FormTemplate;
  deleteTemplate: (id: string) => void;
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

const mockForms: BusinessForm[] = [
  {
    id: 'frm-demo-approved-survey',
    businessId: 'demo-business-id',
    businessName: 'Demo Business',
    type: 'survey',
    title: 'Customer Experience Survey',
    key: 'customer-experience-survey',
    status: 'approved',
    fields: [
      { id: 'f-1', label: 'How was your experience?', type: 'rating', required: true },
      { id: 'f-2', label: 'What can we improve?', type: 'long_text' }
    ],
    responseChannels: ['email'],
    responseActor: 'agent',
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: 'frm-demo-approved-complaint',
    businessId: 'demo-business-id',
    businessName: 'Demo Business',
    type: 'complaint',
    title: 'Service Complaint Form',
    key: 'service-complaint-form',
    status: 'approved',
    fields: [
      { id: 'c-1', label: 'What went wrong?', type: 'long_text', required: true },
      { id: 'c-2', label: 'How urgent is this?', type: 'choice', required: true, options: ['Low', 'Medium', 'High'] }
    ],
    responseChannels: ['sms', 'whatsapp', 'email'],
    responseActor: 'agent',
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: 'frm-demo-pending-social',
    businessId: 'demo-business-id',
    businessName: 'Demo Business',
    type: 'social',
    title: 'Social Profile Capture',
    key: 'social-profile-capture',
    status: 'pending',
    fields: [
      { id: 's-1', label: 'Instagram handle', type: 'short_text' },
      { id: 's-2', label: 'Would you like follow-up offers?', type: 'choice', options: ['Yes', 'No'] }
    ],
    responseChannels: ['email'],
    responseActor: 'bot',
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

const mockSubmissions: FormSubmission[] = [
  {
    id: 'sub-demo-1',
    formId: 'frm-demo-approved-survey',
    businessId: 'demo-business-id',
    formType: 'survey',
    formTitle: 'Customer Experience Survey',
    customerName: 'Jane Doe',
    customerEmail: 'jane.doe@example.com',
    customerPhone: '+1 (555) 234-5678',
    answers: {
      'f-1': 5,
      'f-2': 'Great team and quick service.'
    },
    status: 'responded',
    createdAt: nowIso(),
    response: {
      channel: 'email',
      actor: 'agent',
      message: 'Thanks for the feedback, Jane. We appreciate you!',
      respondedAt: nowIso(),
      responderName: 'Support Team'
    }
  },
  {
    id: 'sub-demo-2',
    formId: 'frm-demo-approved-survey',
    businessId: 'demo-business-id',
    formType: 'survey',
    formTitle: 'Customer Experience Survey',
    customerName: 'Marcus Smith',
    customerEmail: 'm.smith@company.org',
    answers: {
      'f-1': 4,
      'f-2': 'Checkout line took longer than expected.'
    },
    status: 'new',
    createdAt: nowIso()
  },
  {
    id: 'sub-demo-3',
    formId: 'frm-demo-approved-complaint',
    businessId: 'demo-business-id',
    formType: 'complaint',
    formTitle: 'Service Complaint Form',
    customerName: 'Alice Lawson',
    customerPhone: '+1 (555) 111-2233',
    answers: {
      'c-1': 'Wrong item was delivered.',
      'c-2': 'High'
    },
    status: 'in_review',
    createdAt: nowIso()
  },
  {
    id: 'sub-demo-4',
    formId: 'frm-demo-approved-complaint',
    businessId: 'demo-business-id',
    formType: 'complaint',
    formTitle: 'Service Complaint Form',
    customerName: 'Robert Taylor',
    customerEmail: 'robert@taylor.me',
    answers: {
      'c-1': 'Billing amount was incorrect.',
      'c-2': 'Medium'
    },
    status: 'closed',
    createdAt: nowIso(),
    response: {
      channel: 'whatsapp',
      actor: 'agent',
      message: 'Issue resolved and invoice corrected.',
      respondedAt: nowIso(),
      responderName: 'Billing Desk'
    }
  }
];

const mockTemplates: FormTemplate[] = [
  {
    id: 'tmpl-birthday',
    title: 'Birthday Celebration Form',
    description: 'Perfect for collecting birthday details from customers for special rewards.',
    type: 'social',
    fields: [
      { id: 'f-b1', label: 'Full Name', type: 'short_text', required: true },
      { id: 'f-b2', label: 'Birth Date', type: 'short_text', required: true },
      { id: 'f-b3', label: 'Favorite Drink/Snack', type: 'short_text' }
    ],
    isSystem: true,
    createdAt: nowIso()
  }
];

export const useBusinessFormsStore = create<BusinessFormsState>()(
  persist(
    (set, get) => ({
      forms: mockForms,
      submissions: mockSubmissions,
      templates: mockTemplates,
      customTypeOptionsByBusiness: {},
      createForm: (input) => {
        const key = ensureUniqueKey(input.key || input.title, get().forms);
        const form: BusinessForm = {
          id: `frm-${Date.now().toString(36)}`,
          businessId: input.businessId,
          businessName: input.businessName,
          type: input.type,
          typeLabel: input.typeLabel?.trim(),
          title: input.title.trim(),
          key,
          status: 'pending',
          fields: input.fields,
          responseChannels: input.responseChannels.length ? input.responseChannels : ['email'],
          responseActor: input.responseActor,
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        set((state) => ({ forms: [form, ...state.forms] }));
        return form;
      },
      updateForm: (id, updates) =>
        set((state) => ({
          forms: state.forms.map((form) =>
            form.id === id ? { ...form, ...updates, updatedAt: nowIso(), key: slugifyKey(updates.key || form.key) } : form
          )
        })),
      setFormStatus: (id, status, reviewedBy, reviewNote) =>
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
          )
        })),
      submitForm: (input) => {
        const submission: FormSubmission = {
          id: `sub-${Date.now().toString(36)}`,
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
        set((state) => ({ submissions: [submission, ...state.submissions] }));
        return submission;
      },
      setSubmissionStatus: (id, status) =>
        set((state) => ({
          submissions: state.submissions.map((submission) =>
            submission.id === id ? { ...submission, status } : submission
          )
        })),
      respondToSubmission: (id, payload) =>
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
          )
        })),
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
      createTemplate: (input) => {
        const template: FormTemplate = {
          ...input,
          id: `tmpl-${Date.now().toString(36)}`,
          createdAt: nowIso()
        };
        set((state) => ({ templates: [template, ...state.templates] }));
        return template;
      },
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id)
        }))
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
