export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'range' | 'checkbox' | 'select' | 'radio' | 'email' | 'phone' | 'date' | 'boolean';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    step?: number;
  };
  order: number;
}

export interface Form {
  id: string;
  qrCodeId: string;
  title: string;
  description?: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  answers: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface CreateFormDto {
  qrCodeId: string;
  title: string;
  description?: string;
  fields: Omit<FormField, 'id' | 'order'>[];
}
