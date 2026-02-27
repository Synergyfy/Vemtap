
import { create } from 'zustand';

interface Spec {
  id: string;
  label: string;
  value: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
}

interface VolumeDiscount {
  id: string;
  minQty: number;
  maxQty: number | null; // null for "+" (infinity)
  discountPercent: number;
}

interface ProductFormData {
  // Step 1
  title: string;
  category: string;
  tag: string;
  tagColor: string;
  sku: string;
  description: string;
  productTypeId: string;

  // Step 2
  images: {
    primary: File | string | null;
    side: File | string | null;
    detail: File | string | null;
    packaging: File | string | null;
  };
  video: {
    file: File | null;
    url: string;
    autoplay: boolean;
  };
  specs: Spec[];
  howToSteps: Step[];

  // Step 3
  msrp: number;
  originalPrice: number;
  costPrice: number;
  bulkQuotesEnabled: boolean;
  customBrandingEnabled: boolean;
  customizationFee: number;
  volumeDiscounts: VolumeDiscount[];
}

interface ProductFormState {
  currentStep: number;
  formData: ProductFormData;
  editingProductId: string | null;
  submissionStatus: 'idle' | 'success' | 'error';
  submissionError: string | null;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<ProductFormData>) => void;
  loadProductForEditing: (product: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmissionResult: (status: 'idle' | 'success' | 'error', error?: string | null) => void;
  resetForm: () => void;
}

const initialFormData: ProductFormData = {
  title: '',
  category: 'NFC Hardware',
  tag: 'New Arrival',
  tagColor: 'bg-primary',
  sku: '',
  description: '',
  productTypeId: '',
  images: { primary: null, side: null, detail: null, packaging: null },
  video: { file: null, url: '', autoplay: false },
  specs: [
    { id: '1', label: 'Frequency', value: '13.56 MHz' },
    { id: '2', label: 'Connection Interface', value: 'USB 2.0 / Bluetooth 5.0' }
  ],
  howToSteps: [
    { id: '1', title: 'Tap to Connect', description: 'Enable NFC on your device and tap the reader.' }
  ],
  msrp: 450.00,
  originalPrice: 0,
  costPrice: 280.00,
  bulkQuotesEnabled: true,
  customBrandingEnabled: false,
  customizationFee: 1500,
  volumeDiscounts: [
    { id: '1', minQty: 1, maxQty: 9, discountPercent: 0 },
    { id: '2', minQty: 10, maxQty: 49, discountPercent: 5 },
    { id: '3', minQty: 50, maxQty: null, discountPercent: 12 },
  ]
};

export const useProductFormStore = create<ProductFormState>((set) => ({
  currentStep: 1,
  formData: initialFormData,
  editingProductId: null,
  submissionStatus: 'idle',
  submissionError: null,
  setStep: (step) => set({ currentStep: step }),
  updateFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  loadProductForEditing: (product) => set({
    editingProductId: product.id,
    currentStep: 1,
    submissionStatus: 'idle',
    submissionError: null,
    formData: {
      ...initialFormData,
      title: product.name,
      category: product.category || 'NFC Hardware',
      tag: product.tag || 'New Arrival',
      tagColor: product.tagColor || 'bg-primary',
      sku: product.sku || '',
      description: product.description || '',
      productTypeId: product.productTypeId || '',
      msrp: Number(product.price) || 450,
      images: {
        primary: product.image || null,
        side: null,
        detail: null,
        packaging: null
      }
    }
  }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  setSubmissionResult: (status, error = null) => set({ submissionStatus: status, submissionError: error }),
  resetForm: () => set({
    currentStep: 1,
    formData: initialFormData,
    editingProductId: null,
    submissionStatus: 'idle',
    submissionError: null,
  }),
}));
