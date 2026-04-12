import type { DotType, CornerDotType, CornerSquareType, ErrorCorrectionLevel, Mode, TypeNumber, GradientType } from "qr-code-styling";
import type { FormField } from "./form";

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
  
export interface FileData {
  id?: string;
  url: string;
  name?: string;
  size?: number;
  publicId?: string;
}

export interface PendingFile {
  file: File;
  signedUrl?: string;
}

export interface MenuData {
  themeColor?: string;
  restaurantName?: string;
  description?: string;
  logo?: string;
  banner?: string;
  currency?: string;
  categories?: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      description?: string;
      price: number;
      image?: string;
      flags?: string[];
    }[];
  }[];
  successTitle?: string;
  successMessage?: string;
  customFields?: { id: string; label: string; type: string }[];
  showWhatsappCta?: boolean;
  whatsappNumber?: string;
}

export interface QRData {
  type: QRType;
  name?: string;
  url?: string;

  urlPreview?: {
    title?: string;
    description?: string;
    themeColor?: string;
  };
  text?: string;
  image?: {
    url: string;
    name?: string;
    size?: number;
    publicId?: string;
    caption?: string;
    pendingFile?: PendingFile;
  };
  images?: (FileData & { pendingFile?: PendingFile; caption?: string })[];
  imageGalleryInfo?: {
    bannerImage?: FileData & { pendingFile?: PendingFile };
    logoImage?: FileData & { pendingFile?: PendingFile };
    title?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    themeColor?: string;
  };
  pdf?: FileData & { 
    pendingFile?: PendingFile;
    companyName?: string;
    title?: string;
    description?: string;
    previewImage?: string;
    themeColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  video?: {
    id?: string;
    url: string;
    name?: string;
    size?: number;
    publicId?: string;
    platform?: 'youtube' | 'vimeo' | 'other';
    pendingFile?: PendingFile;
    companyName?: string;
    title?: string;
    description?: string;
    footerText?: string;
    themeColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  mp3?: FileData & { 
    pendingFile?: PendingFile;
    companyName?: string;
    title?: string;
    description?: string;
    artist?: string;
    buttonText?: string;
    themeColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  facebook?: {
    name?: string;
    bio?: string;
    logo?: string;
    banner?: string;
  };
  app?: {
    ios?: string;
    android?: string;
    title?: string;
    description?: string;
    icon?: string;
    themeColor?: string;
  };
  vcard?: {
    firstName: string;
    lastName: string;
    mobile: string;
    phone?: string;
    email: string;
    website?: string;
    address: string;
    company?: string;
    jobTitle?: string;
    note?: string;
    avatar?: string;
    avatarPublicId?: string;
    avatarPendingFile?: PendingFile;
    banner?: string;
    bannerPublicId?: string;
    bannerPendingFile?: PendingFile;
    themeColor?: string;
    accentColor?: string;
    socials?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      tiktok?: string;
      github?: string;
      whatsapp?: string;
    };
  };
  wifi?: {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
  };
  email?: {
    address: string;
    subject: string;
    body: string;
  };
  sms?: {
    number: string;
    message: string;
  };
  whatsapp?: {
    number?: string;
    countryCode?: string;
    phoneNumber?: string;
    message: string;
  };
  phone?: {
    number: string;
  };
  social?: {
    username: string;
    platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  };
  socials?: {
    name?: string;
    bio?: string;
    images?: (FileData & { pendingFile?: PendingFile; caption?: string })[];
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  crypto?: {
    address: string;
    coin: 'bitcoin' | 'ethereum' | 'litecoin';
    amount?: string;
  };
  event?: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  };
  form?: {
    title: string;
    description?: string;
    fields: FormField[];
  };
  linksInfo?: {
    themeColor?: string;
    linkBgColor?: string;
    linkTextColor?: string;
    avatar?: string;
    banner?: string;
    title?: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  linksList?: {
    title: string;
    url: string;
    icon?: string;
  }[];
  business?: {
    themeColor?: string;
    accentColor?: string;
    companyName?: string;
    headline?: string;
    about?: string;
    logo?: string;
    banner?: string;
    contact?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
    };
    socials?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
    openingHours?: {
      monday?: string | { from: string; to: string; isClosed?: boolean };
      tuesday?: string | { from: string; to: string; isClosed?: boolean };
      wednesday?: string | { from: string; to: string; isClosed?: boolean };
      thursday?: string | { from: string; to: string; isClosed?: boolean };
      friday?: string | { from: string; to: string; isClosed?: boolean };
      saturday?: string | { from: string; to: string; isClosed?: boolean };
      sunday?: string | { from: string; to: string; isClosed?: boolean };
    };
  };
  menu?: MenuData;
  coupon?: {
    themeColor?: string;
    title?: string;
    description?: string;
    discount?: string; // e.g. "20% OFF" or "$10 OFF"
    promoCode?: string;
    barcode?: string; // can be same as promo text, rendered as visual barcode
    validUntil?: string;
    terms?: string;
    banner?: string;
    companyName?: string;
    website?: string;
  };
  booking?: {
    businessName?: string;
    title?: string;
    description?: string;
    location?: string;
    bookingUrl?: string;
    imageUrl?: string;
    profileImageUrl?: string;
    themeColor?: string;
    buttonText?: string;
    price?: string;
    duration?: string;
    destinationMode?: 'url' | 'calendar' | 'qr_link';
    qrLinkId?: string;
    customFormEnabled?: boolean;
    customFormFields?: FormField[];
    whatsappEnabled?: boolean;
    whatsappNumber?: string;
  };
}

export interface Gradient {
  type: GradientType;
  rotation: number;
  colorStops: { offset: number; color: string }[];
}

export interface QRDesignOptions {
  dots: {
    type: DotType;
    color: string;
    gradient?: Gradient;
  };
  cornersSquare: {
    type: CornerSquareType;
    color: string;
    gradient?: Gradient;
  };
  cornersDot: {
    type: CornerDotType;
    color: string;
    gradient?: Gradient;
  };
  background: {
    color: string;
    gradient?: Gradient;
  };
  imageOptions: {
    hideBackgroundDots: boolean;
    imageSize: number;
    margin: number;
  };
  qrOptions: {
    typeNumber: TypeNumber;
    mode: Mode;
    errorCorrectionLevel: ErrorCorrectionLevel;
  };
}

export interface QRFrameOptions {
  type: 'none' | 'simple' | 'text-below' | 'bubble' | 'ribbon' | 'bracket' | 'rounded-thick' | 'shadow' | 'phone' | 'circular' | 'tag' | 'minimal';
  text?: string;
  color?: string;
  textColor?: string;
  font?: string;
}

export interface QRConfiguration {
  data: QRData;
  design: QRDesignOptions;
  logo?: string;
  frame: QRFrameOptions;
  width: number;
  height: number;
  margin: number;
  isDynamic: boolean;
  shortId?: string;
}
