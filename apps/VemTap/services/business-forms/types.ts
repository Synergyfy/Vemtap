export type ApiFormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface BusinessFormField {
  id?: string;
  type: ApiFormFieldType;
  question: string;
  options?: string[];
  isRequired: boolean;
  order: number;
}

export interface BusinessForm {
  id: string;
  uniqueCode: string;
  title: string;
  description?: string;
  isActive: boolean;
  isPublished: boolean;
  showAfterLeadCapture?: boolean;
  businessId: string;
  branchId: string;
  businessName?: string;
  businessLogo?: string;
  templateId?: string;
  templateName?: string;
  templateScope?: 'branch' | 'business' | 'global';
  usageModes?: Array<'link' | 'qr' | 'messaging'>;
  linkedTargets?: string[];
  redirectUrl?: string;
  redirectLabel?: string;
  instructions?: string;
  fields: BusinessFormField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessFormRequest {
  title: string;
  description?: string;
  isActive: boolean;
  isPublished: boolean;
  showAfterLeadCapture?: boolean;
  branchId: string;
  businessId?: string;
  businessName?: string;
  templateId?: string;
  templateName?: string;
  templateScope?: 'branch' | 'business' | 'global';
  usageModes?: Array<'link' | 'qr' | 'messaging'>;
  linkedTargets?: string[];
  redirectUrl?: string;
  redirectLabel?: string;
  instructions?: string;
  fields: Omit<BusinessFormField, 'id'>[];
}

export type UpdateBusinessFormRequest = Partial<CreateBusinessFormRequest>;

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  businessId?: string;
  businessName?: string;
  branchId?: string;
  scope: 'branch' | 'business' | 'global';
  fields: Omit<BusinessFormField, 'id'>[];
  redirectUrl?: string;
  redirectLabel?: string;
  linkedTargets?: string[];
  usageModes?: Array<'link' | 'qr' | 'messaging'>;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormTemplateRequest {
  name: string;
  description?: string;
  branchId?: string;
  scope: 'branch' | 'business' | 'global';
  fields: Omit<BusinessFormField, 'id'>[];
  redirectUrl?: string;
  redirectLabel?: string;
  linkedTargets?: string[];
  usageModes?: Array<'link' | 'qr' | 'messaging'>;
  instructions?: string;
}

export interface BusinessFormResponseItem {
  id: string;
  formId?: string;
  createdAt?: string;
  updatedAt?: string;
  respondent?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  answers?: Record<string, unknown> | Array<{ fieldId?: string; question?: string; value?: unknown }>;
  [key: string]: unknown;
}

export type BusinessFormSubmitAnswer = {
  fieldId: string;
  value: unknown;
};

export type SubmitBusinessFormResponseRequest = {
  answers: BusinessFormSubmitAnswer[];
};
