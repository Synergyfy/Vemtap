import type {
  BusinessForm,
  BusinessFormResponseItem,
  CreateBusinessFormRequest,
  CreateFormTemplateRequest,
  FormTemplate,
  UpdateBusinessFormRequest,
} from './types';

const FORMS_KEY = 'vemtap-mock-visitor-forms-v1';
const RESPONSES_KEY = 'vemtap-mock-visitor-form-responses-v1';
const TEMPLATES_KEY = 'vemtap-mock-visitor-form-templates-v1';

const nowIso = () => new Date().toISOString();

type SessionMeta = {
  businessId: string;
  businessName: string;
  businessLogo?: string;
  branchId: string;
};

const getSessionMeta = (): SessionMeta => {
  if (typeof window === 'undefined') {
    return {
      businessId: 'demo-business-id',
      businessName: 'Demo Business',
      businessLogo: '/icon.png',
      branchId: 'head-office',
    };
  }

  try {
    const authStorage = localStorage.getItem('auth-storage-v2');
    const state = authStorage ? JSON.parse(authStorage)?.state : null;
    const user = state?.user || {};

    return {
      businessId: user.businessId || 'demo-business-id',
      businessName: user.businessName || 'Demo Business',
      businessLogo: user.businessLogo || '/icon.png',
      branchId: user.branchId || 'head-office',
    };
  } catch {
    return {
      businessId: 'demo-business-id',
      businessName: 'Demo Business',
      businessLogo: '/icon.png',
      branchId: 'head-office',
    };
  }
};

const seedTemplates = (session: SessionMeta): FormTemplate[] => [
  {
    id: 'tmpl-feedback-branch',
    name: 'Branch Feedback Template',
    description: 'Customer feedback capture with fast redirection to a thank-you page.',
    businessId: session.businessId,
    businessName: session.businessName,
    branchId: session.branchId,
    scope: 'branch',
    usageModes: ['link', 'qr', 'messaging'],
    linkedTargets: ['messaging-center', 'social-bio', 'post-subscription'],
    redirectUrl: 'https://example.com/thank-you',
    redirectLabel: 'Thank You Page',
    instructions: 'Use this for in-store taps, WhatsApp follow-up, or social traffic capture.',
    fields: [
      { type: 'text', question: 'Full name', isRequired: true, order: 1 },
      { type: 'text', question: 'What brought you in today?', isRequired: true, order: 2 },
      { type: 'radio', question: 'Rate your experience', options: ['1', '2', '3', '4', '5'], isRequired: true, order: 3 },
      { type: 'textarea', question: 'Anything we should improve?', isRequired: false, order: 4 },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'tmpl-social-capture',
    name: 'Social Lead Capture',
    description: 'Collect profile details before sending customers into social or messaging journeys.',
    businessId: session.businessId,
    businessName: session.businessName,
    branchId: session.branchId,
    scope: 'branch',
    usageModes: ['link', 'messaging'],
    linkedTargets: ['instagram-bio', 'whatsapp-template'],
    instructions: 'Ideal for Instagram bio, post captions, or outbound campaigns.',
    fields: [
      { type: 'text', question: 'Name', isRequired: true, order: 1 },
      { type: 'text', question: 'Instagram handle', isRequired: false, order: 2 },
      { type: 'checkbox', question: 'Topics you want updates on', options: ['Offers', 'Events', 'New products'], isRequired: false, order: 3 },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedForms = (session: SessionMeta): BusinessForm[] => [
  {
    id: 'vf-demo-feedback',
    title: 'Customer Feedback Flow',
    description: 'Branch feedback form linked to in-store engagement and follow-up messages.',
    isActive: true,
    isPublished: true,
    businessId: session.businessId,
    businessName: session.businessName,
    businessLogo: session.businessLogo,
    branchId: session.branchId,
    templateId: 'tmpl-feedback-branch',
    templateName: 'Branch Feedback Template',
    templateScope: 'branch',
    usageModes: ['link', 'qr', 'messaging'],
    linkedTargets: ['messaging-center', 'google-review-cta', 'subscription-onboarding'],
    redirectUrl: 'https://example.com/thank-you',
    redirectLabel: 'Thank You Page',
    instructions: 'Configure your business after subscription, then share via link, QR, or messaging.',
    fields: [
      { id: 'vf-name', type: 'text', question: 'Full name', isRequired: true, order: 1 },
      { id: 'vf-visit-reason', type: 'text', question: 'What brought you in today?', isRequired: true, order: 2 },
      { id: 'vf-rating', type: 'radio', question: 'Rate your experience', options: ['1', '2', '3', '4', '5'], isRequired: true, order: 3 },
      { id: 'vf-feedback', type: 'textarea', question: 'Anything we should improve?', isRequired: false, order: 4 },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedResponses = (session: SessionMeta): BusinessFormResponseItem[] => [
  {
    id: 'resp-demo-1',
    formId: 'vf-demo-feedback',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    answers: {
      'vf-name': 'Jane Doe',
      'vf-visit-reason': 'Lunch meeting',
      'vf-rating': '5',
      'vf-feedback': 'Fast service and clear communication.',
    },
    businessName: session.businessName,
  },
];

const readStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureSeeded = () => {
  const session = getSessionMeta();
  const forms = readStorage<BusinessForm[]>(FORMS_KEY, []);
  const responses = readStorage<BusinessFormResponseItem[]>(RESPONSES_KEY, []);
  const templates = readStorage<FormTemplate[]>(TEMPLATES_KEY, []);

  if (forms.length === 0) writeStorage(FORMS_KEY, seedForms(session));
  if (responses.length === 0) writeStorage(RESPONSES_KEY, seedResponses(session));
  if (templates.length === 0) writeStorage(TEMPLATES_KEY, seedTemplates(session));
};

const withIds = (payload: CreateBusinessFormRequest) =>
  payload.fields.map((field, index) => ({
    ...field,
    id: `field-${Date.now().toString(36)}-${index + 1}`,
    order: field.order ?? index + 1,
  }));

export const getMockForms = (): BusinessForm[] => {
  ensureSeeded();
  return readStorage<BusinessForm[]>(FORMS_KEY, []);
};

export const getMockForm = (id?: string): BusinessForm | undefined =>
  getMockForms().find((form) => form.id === id);

export const createMockForm = (payload: CreateBusinessFormRequest): BusinessForm => {
  const session = getSessionMeta();
  const forms = getMockForms();
  const template = getMockTemplates().find((item) => item.id === payload.templateId);
  const form: BusinessForm = {
    id: `vf-${Date.now().toString(36)}`,
    title: payload.title,
    description: payload.description,
    isActive: payload.isActive,
    isPublished: payload.isPublished,
    businessId: payload.businessId || session.businessId,
    businessName: payload.businessName || session.businessName,
    businessLogo: payload.businessLogo || session.businessLogo,
    branchId: payload.branchId || session.branchId,
    templateId: payload.templateId,
    templateName: payload.templateName || template?.name,
    templateScope: payload.templateScope || template?.scope,
    usageModes: payload.usageModes || template?.usageModes || ['link', 'qr', 'messaging'],
    linkedTargets: payload.linkedTargets || template?.linkedTargets || [],
    redirectUrl: payload.redirectUrl || template?.redirectUrl,
    redirectLabel: payload.redirectLabel || template?.redirectLabel,
    instructions: payload.instructions || template?.instructions,
    fields: withIds(payload),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  writeStorage(FORMS_KEY, [form, ...forms]);
  return form;
};

export const updateMockForm = (id: string, updates: UpdateBusinessFormRequest): BusinessForm | undefined => {
  const forms = getMockForms();
  let updatedForm: BusinessForm | undefined;

  const next = forms.map((form) => {
    if (form.id !== id) return form;
    updatedForm = {
      ...form,
      ...updates,
      fields: updates.fields ? withIds({ ...form, ...updates, fields: updates.fields } as CreateBusinessFormRequest) : form.fields,
      updatedAt: nowIso(),
    };
    return updatedForm;
  });

  writeStorage(FORMS_KEY, next);
  return updatedForm;
};

export const deleteMockForm = (id: string) => {
  writeStorage(
    FORMS_KEY,
    getMockForms().filter((form) => form.id !== id)
  );
};

export const getMockResponses = (formId?: string): BusinessFormResponseItem[] =>
  readStorage<BusinessFormResponseItem[]>(RESPONSES_KEY, []).filter((item) => !formId || item.formId === formId);

export const submitMockResponse = (
  formId: string,
  payload: Pick<BusinessFormResponseItem, 'customerName' | 'customerEmail' | 'customerPhone' | 'answers'>
): BusinessFormResponseItem => {
  ensureSeeded();
  const responses = readStorage<BusinessFormResponseItem[]>(RESPONSES_KEY, []);
  const item: BusinessFormResponseItem = {
    id: `resp-${Date.now().toString(36)}`,
    formId,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    answers: payload.answers,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  writeStorage(RESPONSES_KEY, [item, ...responses]);
  return item;
};

export const getMockTemplates = (): FormTemplate[] => {
  ensureSeeded();
  return readStorage<FormTemplate[]>(TEMPLATES_KEY, []);
};

export const createMockTemplate = (payload: CreateFormTemplateRequest): FormTemplate => {
  const session = getSessionMeta();
  const templates = getMockTemplates();
  const item: FormTemplate = {
    id: `tmpl-${Date.now().toString(36)}`,
    name: payload.name,
    description: payload.description,
    businessId: session.businessId,
    businessName: session.businessName,
    branchId: payload.branchId || session.branchId,
    scope: payload.scope,
    fields: payload.fields,
    redirectUrl: payload.redirectUrl,
    redirectLabel: payload.redirectLabel,
    linkedTargets: payload.linkedTargets || [],
    usageModes: payload.usageModes || ['link', 'qr', 'messaging'],
    instructions: payload.instructions,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  writeStorage(TEMPLATES_KEY, [item, ...templates]);
  return item;
};
