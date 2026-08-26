export interface MockBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryName: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  logoColor: string;
  hasDeals: boolean;
  activeDeals: number;
}

export interface MockRecommendation {
  id: string;
  type: 'deal' | 'business';
  title: string;
  subtitle: string;
  category: string;
  location: string;
  discountPercent?: number;
  originalPrice?: number;
  dealPrice?: number;
  imageColor: string;
  businessName: string;
  businessSlug: string;
  cta: string;
  viewCount?: number;
  dealTag?: string;
}

export const HOME_CATEGORIES = [
  { id: 'food-and-hospitality', name: 'Food', emoji: '🍔' },
  { id: 'retail-and-shops', name: 'Fashion', emoji: '👗' },
  { id: 'beauty-and-personal-care', name: 'Beauty', emoji: '💄' },
  { id: 'technology-and-digital', name: 'Electronics', emoji: '📱' },
  { id: 'real-estate-and-property', name: 'Home', emoji: '🏠' },
  { id: 'automotive', name: 'Auto', emoji: '🚗' },
  { id: 'health-and-medical', name: 'Health', emoji: '💊' },
  { id: 'events-and-entertainment', name: 'Events', emoji: '🎉' },
  { id: 'education-and-training', name: 'Education', emoji: '🎓' },
  { id: 'professional-services', name: 'Services', emoji: '💼' },
];

export const MOCK_BUSINESSES: MockBusiness[] = [
  { id: 'b1', name: 'Bella Restaurant', slug: 'bella-restaurant', category: 'food-and-hospitality', categoryName: 'Food & Drinks', address: 'Wuse 2, Abuja', city: 'Abuja', rating: 4.8, reviewCount: 234, logoColor: '#FF6B6B', hasDeals: true, activeDeals: 3 },
  { id: 'b2', name: 'StyleHub Fashion', slug: 'stylehub-fashion', category: 'retail-and-shops', categoryName: 'Fashion', address: 'Lekki Phase 1, Lagos', city: 'Lagos', rating: 4.6, reviewCount: 189, logoColor: '#4ECDC4', hasDeals: true, activeDeals: 2 },
  { id: 'b3', name: 'Glow Beauty Spa', slug: 'glow-beauty-spa', category: 'beauty-and-personal-care', categoryName: 'Beauty', address: 'Victoria Island, Lagos', city: 'Lagos', rating: 4.9, reviewCount: 312, logoColor: '#FF85A1', hasDeals: true, activeDeals: 1 },
  { id: 'b4', name: 'TechZone Electronics', slug: 'techzone-electronics', category: 'technology-and-digital', categoryName: 'Electronics', address: 'Computer Village, Lagos', city: 'Lagos', rating: 4.5, reviewCount: 156, logoColor: '#45B7D1', hasDeals: false, activeDeals: 0 },
  { id: 'b5', name: 'Fresh Mart Supermarket', slug: 'fresh-mart-supermarket', category: 'retail-and-shops', categoryName: 'Supermarket', address: 'Gwarinpa, Abuja', city: 'Abuja', rating: 4.7, reviewCount: 278, logoColor: '#96CEB4', hasDeals: true, activeDeals: 5 },
  { id: 'b6', name: 'Ace Auto Works', slug: 'ace-auto-works', category: 'automotive', categoryName: 'Automotive', address: 'Ojodu Berger, Lagos', city: 'Lagos', rating: 4.4, reviewCount: 98, logoColor: '#FFEAA7', hasDeals: true, activeDeals: 1 },
  { id: 'b7', name: 'SunFit Gym', slug: 'sunfit-gym', category: 'health-and-medical', categoryName: 'Fitness', address: 'Maitama, Abuja', city: 'Abuja', rating: 4.8, reviewCount: 201, logoColor: '#DDA0DD', hasDeals: false, activeDeals: 0 },
  { id: 'b8', name: 'GreenLeaf Organics', slug: 'greenleaf-organics', category: 'retail-and-shops', categoryName: 'Health Foods', address: 'Ikoyi, Lagos', city: 'Lagos', rating: 4.6, reviewCount: 145, logoColor: '#98D8C8', hasDeals: true, activeDeals: 2 },
];

export const MOCK_RECOMMENDATIONS: MockRecommendation[] = [
  { id: 'r1', type: 'deal', title: '20% OFF All Main Courses', subtitle: 'Valid till Sunday', category: 'Food & Drinks', location: 'Wuse 2, Abuja', discountPercent: 20, originalPrice: 12000, dealPrice: 9600, imageColor: '#FF6B6B', businessName: 'Bella Restaurant', businessSlug: 'bella-restaurant', cta: 'View Deal', viewCount: 1520, dealTag: '20% OFF' },
  { id: 'r2', type: 'business', title: 'StyleHub Fashion', subtitle: 'Latest arrivals for men and women', category: 'Fashion', location: 'Lekki, Lagos', imageColor: '#4ECDC4', businessName: 'StyleHub Fashion', businessSlug: 'stylehub-fashion', cta: 'View Business', viewCount: 890, dealTag: 'New Collection' },
  { id: 'r3', type: 'deal', title: 'Buy 2 Get 1 Free on Facials', subtitle: 'This weekend only', category: 'Beauty', location: 'Victoria Island, Lagos', originalPrice: 25000, dealPrice: 16667, imageColor: '#FF85A1', businessName: 'Glow Beauty Spa', businessSlug: 'glow-beauty-spa', cta: 'View Deal', viewCount: 720, dealTag: 'Buy 2 Get 1 Free' },
  { id: 'r4', type: 'business', title: 'TechZone Electronics', subtitle: 'Phones, laptops and gadgets', category: 'Electronics', location: 'Computer Village, Lagos', imageColor: '#45B7D1', businessName: 'TechZone Electronics', businessSlug: 'techzone-electronics', cta: 'View Business', viewCount: 1340, dealTag: 'Up to 15% OFF' },
  { id: 'r5', type: 'deal', title: '₦5,000 OFF Samsung Galaxy A15', subtitle: 'Limited stock available', category: 'Electronics', location: 'Computer Village, Lagos', originalPrice: 89000, dealPrice: 84000, imageColor: '#45B7D1', businessName: 'TechZone Electronics', businessSlug: 'techzone-electronics', cta: 'View Deal', viewCount: 2100, dealTag: '₦5,000 OFF' },
  { id: 'r6', type: 'business', title: 'Fresh Mart Supermarket', subtitle: 'Fresh groceries delivered to you', category: 'Supermarket', location: 'Gwarinpa, Abuja', imageColor: '#96CEB4', businessName: 'Fresh Mart Supermarket', businessSlug: 'fresh-mart-supermarket', cta: 'View Business', viewCount: 650, dealTag: 'Free Delivery' },
];

export const MOCK_TRENDING = [
  { id: 't1', title: '30% OFF Weekend Brunch', businessName: 'Bella Restaurant', category: 'Food & Drinks', location: 'Wuse 2, Abuja', discountPercent: 30, originalPrice: 15000, dealPrice: 10500, imageColor: '#FF6B6B', isHot: true, claimedPercent: 68, viewCount: 1890 },
  { id: 't2', title: 'Flat 25% OFF All Shoes', businessName: 'StyleHub Fashion', category: 'Fashion', location: 'Lekki, Lagos', discountPercent: 25, originalPrice: 20000, dealPrice: 15000, imageColor: '#4ECDC4', isHot: true, claimedPercent: 45, viewCount: 1340 },
  { id: 't3', title: '₦3,000 OFF Hair Treatment', businessName: 'Glow Beauty Spa', category: 'Beauty', location: 'Victoria Island, Lagos', originalPrice: 18000, dealPrice: 15000, imageColor: '#FF85A1', isHot: false, claimedPercent: 32, viewCount: 980 },
  { id: 't4', title: '15% OFF Organic Produce Bundle', businessName: 'GreenLeaf Organics', category: 'Health Foods', location: 'Ikoyi, Lagos', discountPercent: 15, originalPrice: 25000, dealPrice: 21250, imageColor: '#98D8C8', isHot: false, claimedPercent: 55, viewCount: 720 },
  { id: 't5', title: 'Free Gym Trial — 1 Week', businessName: 'SunFit Gym', category: 'Fitness', location: 'Maitama, Abuja', originalPrice: 15000, dealPrice: 0, imageColor: '#DDA0DD', isHot: true, claimedPercent: 82, viewCount: 2100 },
  { id: 't6', title: '20% OFF Car Service', businessName: 'Ace Auto Works', category: 'Automotive', location: 'Ojodu Berger, Lagos', discountPercent: 20, originalPrice: 35000, dealPrice: 28000, imageColor: '#FFEAA7', isHot: false, claimedPercent: 28, viewCount: 560 },
];

export const MOCK_NEW_ON_VEMTAP = [
  { id: 'n1', name: 'Urban Bites Kitchen', category: 'Food & Drinks', location: 'Abuja', imageColor: '#FF6B6B', isNew: true },
  { id: 'n2', name: 'Luxe Nails Studio', category: 'Beauty', location: 'Lagos', imageColor: '#FF85A1', isNew: true },
  { id: 'n3', name: 'GameZone Hub', category: 'Entertainment', location: 'Abuja', imageColor: '#45B7D1', isNew: true },
  { id: 'n4', name: 'Organic Basket', category: 'Health Foods', location: 'Lagos', imageColor: '#96CEB4', isNew: true },
];

export const MOCK_POPULAR = [
  { id: 'p1', title: 'Happy Hour — 2-for-1 Cocktails', businessName: 'Bella Restaurant', category: 'Food & Drinks', location: 'Wuse 2, Abuja', imageColor: '#FF6B6B', viewCount: 1240 },
  { id: 'p2', title: 'New Collection Drop', businessName: 'StyleHub Fashion', category: 'Fashion', location: 'Lekki, Lagos', imageColor: '#4ECDC4', viewCount: 980 },
  { id: 'p3', title: 'Couples Massage Package', businessName: 'Glow Beauty Spa', category: 'Beauty', location: 'Victoria Island, Lagos', imageColor: '#FF85A1', viewCount: 876 },
  { id: 'p4', title: 'Weekend Flash Sale', businessName: 'Fresh Mart Supermarket', category: 'Supermarket', location: 'Gwarinpa, Abuja', imageColor: '#96CEB4', viewCount: 756 },
  { id: 'p5', title: 'iPhone 15 Promo', businessName: 'TechZone Electronics', category: 'Electronics', location: 'Computer Village, Lagos', imageColor: '#45B7D1', viewCount: 1560 },
];
