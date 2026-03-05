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
  title: string;
  description?: string;
  isActive: boolean;
  isPublished: boolean;
  businessId: string;
  branchId: string;
  fields: BusinessFormField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessFormRequest {
  title: string;
  description?: string;
  isActive: boolean;
  isPublished: boolean;
  branchId: string;
  fields: Omit<BusinessFormField, 'id'>[];
}

export type UpdateBusinessFormRequest = Partial<CreateBusinessFormRequest>;

export interface BusinessFormResponseItem {
  id: string;
  formId?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  respondent?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  answers?: Record<string, unknown> | Array<{ fieldId?: string; question?: string; value?: unknown }>;
  [key: string]: unknown;
}
