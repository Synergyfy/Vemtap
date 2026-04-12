export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'range' | 'boolean';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    step?: number;
  };
  order: number;
  helpText?: string;
}

export interface Form {
  id: string;
  qrCodeId: string;
  title: string;
  description?: string;
  fields: FormField[];
  themeColor?: string;
  buttonText?: string;
  successTitle?: string;
  successMessage?: string;
  imageUrl?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  qrCodeId: string;
  answers: Record<string, any>;
  createdAt: string;
}

export interface CreateFormDto {
  qrCodeId: string;
  title: string;
  description?: string;
  fields: FormField[];
  themeColor?: string;
  buttonText?: string;
  successTitle?: string;
  successMessage?: string;
  imageUrl?: string;
}