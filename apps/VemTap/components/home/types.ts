export interface HomeDealCard {
  id: string;
  title: string;
  description: string;
  image: string;
  businessName: string;
  businessSlug?: string;
  category: string;
  location: string;
  originalPrice?: number;
  dealPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  discountLabel?: string;
  href: string;
}

export interface HomeBusinessCard {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  rating?: number;
  activeDeals?: number;
  href: string;
}

export interface HomeProductCard {
  id: string;
  name: string;
  image: string;
  price: number;
  businessName: string;
  href: string;
}

export interface HomeCategory {
  id: string;
  name: string;
  href: string;
}

export interface HomeLocation {
  lat: number;
  lng: number;
  label?: string;
}
