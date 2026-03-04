import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BusinessFormType = 'survey' | 'complaint' | 'social';
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
  answers: Record<string, any>;
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
  answers: Record<string, any>;
}

interface BusinessFormsState {
  forms: BusinessForm[];
  submissions: FormSubmission[];
  createForm: (input: CreateBusinessFormInput) => BusinessForm;
  updateForm: (id: string, updates: Partial<BusinessForm>) => void;
  setFormStatus: (id: string, status: BusinessFormStatus, reviewedBy?: string, reviewNote?: string) => void;
  submitForm: (input: CreateSubmissionInput) => FormSubmission;
  setSubmissionStatus: (id: string, status: SubmissionStatus) => void;
  respondToSubmission: (
    id: string,
    payload: { channel: ResponseChannel; actor: ResponseActor; message: string; responderName?: string }
  ) => void;
}

const nowIso = () => new Date().toISOString();

const slugifyKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

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
  }
];

export const useBusinessFormsStore = create<BusinessFormsState>()(
  persist(
    (set, get) => ({
      forms: mockForms,
      submissions: [],
      createForm: (input) => {
        const key = slugifyKey(input.key || input.title);
        const form: BusinessForm = {
          id: `frm-${Date.now().toString(36)}`,
          businessId: input.businessId,
          businessName: input.businessName,
          type: input.type,
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
