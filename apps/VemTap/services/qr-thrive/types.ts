export interface QrThriveUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  qrThriveUserId?: string;
}

export interface MagicLinkResponse {
  token: string;
  url: string;
  expiresAt: string;
}

export interface QrThriveQRCode {
  id: string;
  shortId: string;
  shortUrl: string;
  name: string;
  description?: string;
  folderId?: string | null;
  type: string;
  isDynamic: boolean;
  status: 'active' | 'archived';
  data: Record<string, any>;
  design: QrThriveDesign;
  frame: QrThriveFrame;
  logo?: string;
  width: number;
  height: number;
  margin: number;
  createdAt: string;
  updatedAt: string;
  scans: number;
  form?: {
    _count: { submissions: number };
  };
}

export interface QrThriveDesign {
  dots: {
    type: string;
    color: string;
    gradient?: QrThriveGradient;
  };
  cornersSquare: {
    type: string;
    color: string;
    gradient?: QrThriveGradient;
  };
  cornersDot: {
    type: string;
    color: string;
    gradient?: QrThriveGradient;
  };
  background: {
    color: string;
    gradient?: QrThriveGradient;
  };
  imageOptions?: {
    hideBackgroundDots: boolean;
    imageSize: number;
    margin: number;
  };
  qrOptions?: {
    typeNumber: number;
    mode: string;
    errorCorrectionLevel: string;
  };
}

export interface QrThriveGradient {
  type: string;
  rotation: number;
  colorStops: { offset: number; color: string }[];
}

export interface QrThriveFrame {
  type: string;
  text?: string;
  color?: string;
  textColor?: string;
  font?: string;
}

export interface CreateQrThriveQRDto {
  name: string;
  description?: string;
  folderId?: string;
  type: string;
  isDynamic?: boolean;
  data: Record<string, any>;
  design: QrThriveDesign;
  frame: QrThriveFrame;
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}

export interface UpdateQrThriveQRDto {
  name?: string;
  description?: string;
  folderId?: string | null;
  type?: string;
  isDynamic?: boolean;
  data?: Record<string, any>;
  design?: QrThriveDesign;
  frame?: QrThriveFrame;
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
  status?: 'active' | 'archived';
}

export interface QrThriveScan {
  id: string;
  qrCodeId: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  city?: string;
  country?: string;
  region?: string;
  createdAt: string;
}

export interface QrThriveFolder {
  id: string;
  name: string;
  color: string;
  _count?: { qrCodes: number };
}

export interface CreateQrThriveFolderDto {
  name: string;
  color: string;
}

export interface QrThriveStats {
  totalQRs: number;
  totalScans: number;
  uniqueVisitors: number;
  scansLastHour: number;
  deviceDist: Record<string, number>;
  osDist: Record<string, number>;
  browserDist: Record<string, number>;
  countryDist: Record<string, number>;
  timeDist: Record<string, number>;
  chartData?: Array<{ name: string; scans: number; unique: number }>;
}

export interface QrThrivePlan {
  id: string;
  name: string;
  description?: string;
  qrCodeLimit: number;
  qrCodeTypes: string[];
  isPopular: boolean;
  isFree: boolean;
  trialDays: number;
  currency: string;
  currencySymbol: string;
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

export interface SubscriptionSyncDto {
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non-renewing';
}

export interface ProvisionUserDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface QrThriveErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}

export interface QrThriveListParams {
  status?: 'active' | 'archived';
  folderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type QRType = 
  | 'url' 
  | 'text' 
  | 'vcard' 
  | 'wifi' 
  | 'email' 
  | 'sms' 
  | 'whatsapp' 
  | 'phone' 
  | 'instagram' 
  | 'facebook' 
  | 'linkedin' 
  | 'twitter' 
  | 'youtube' 
  | 'tiktok' 
  | 'crypto' 
  | 'socials'
  | 'links'
  | 'image'
  | 'event'
  | 'pdf'
  | 'video'
  | 'mp3'
  | 'app'
  | 'form'
  | 'business'
  | 'menu'
  | 'coupon'
  | 'booking';

export const QR_TYPE_LABELS: Record<QRType, { label: string; description: string; category: 'dynamic' | 'static' }> = {
  url: { label: 'Website', description: 'Link to any website URL', category: 'static' },
  pdf: { label: 'PDF', description: 'Show a PDF document', category: 'dynamic' },
  links: { label: 'List of Links', description: 'Share multiple links', category: 'dynamic' },
  vcard: { label: 'vCard', description: 'Share a digital business card', category: 'dynamic' },
  business: { label: 'Business', description: 'Share business information', category: 'dynamic' },
  video: { label: 'Video', description: 'Show a video', category: 'dynamic' },
  image: { label: 'Images', description: 'Share multiple images', category: 'dynamic' },
  facebook: { label: 'Facebook', description: 'Share your Facebook page', category: 'dynamic' },
  instagram: { label: 'Instagram', description: 'Share your Instagram', category: 'dynamic' },
  socials: { label: 'Social Media', description: 'Share all your social channels', category: 'dynamic' },
  whatsapp: { label: 'WhatsApp', description: 'Get WhatsApp messages', category: 'dynamic' },
  mp3: { label: 'MP3', description: 'Share an audio file', category: 'dynamic' },
  menu: { label: 'Menu', description: 'Create a restaurant menu', category: 'dynamic' },
  app: { label: 'Apps', description: 'Redirect to an app store', category: 'dynamic' },
  coupon: { label: 'Coupon', description: 'Share a coupon', category: 'dynamic' },
  booking: { label: 'Booking', description: 'Enable online bookings', category: 'dynamic' },
  wifi: { label: 'WiFi', description: 'Connect to a Wi-Fi network', category: 'static' },
  email: { label: 'Email', description: 'Send an email', category: 'static' },
  sms: { label: 'SMS', description: 'Send an SMS', category: 'static' },
  phone: { label: 'Phone', description: 'Make a phone call', category: 'static' },
  text: { label: 'Text', description: 'Display plain text', category: 'static' },
  crypto: { label: 'Crypto', description: 'Accept cryptocurrency payments', category: 'static' },
  event: { label: 'Event', description: 'Share event details', category: 'dynamic' },
  linkedin: { label: 'LinkedIn', description: 'Share your LinkedIn profile', category: 'dynamic' },
  twitter: { label: 'Twitter/X', description: 'Share your Twitter/X', category: 'dynamic' },
  youtube: { label: 'YouTube', description: 'Share your YouTube channel', category: 'dynamic' },
  tiktok: { label: 'TikTok', description: 'Share your TikTok', category: 'dynamic' },
  form: { label: 'Form', description: 'Collect form submissions', category: 'dynamic' },
};

export const DEFAULT_QR_DESIGN: QrThriveDesign = {
  dots: {
    type: 'square',
    color: '#000000',
  },
  cornersSquare: {
    type: 'square',
    color: '#000000',
  },
  cornersDot: {
    type: 'square',
    color: '#000000',
  },
  background: {
    color: '#ffffff',
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 10,
  },
  qrOptions: {
    typeNumber: 0,
    mode: 'Byte',
    errorCorrectionLevel: 'M',
  },
};

export const DEFAULT_QR_FRAME: QrThriveFrame = {
  type: 'none',
};