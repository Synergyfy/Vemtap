import type { DealOffer } from '@/services/deals/types';
import type { HomeBusinessCard, HomeDealCard } from './types';

export function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) return '';
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function offerToHomeDeal(offer: DealOffer): HomeDealCard {
  const discountPercent =
    offer.pricingType === 'percentage_discount' && offer.discountValue
      ? Number(offer.discountValue)
      : offer.discountPercent || undefined;

  const discountAmount =
    offer.pricingType === 'fixed_discount_price' && offer.discountValue
      ? Number(offer.discountValue)
      : undefined;

  const calcPrice = Number(offer.calculatedPrice);
  const dealPrice = Number(offer.dealPrice ?? offer.calculatedPrice);
  const originalPrice =
    offer.originalPrice ||
    (discountPercent
      ? Math.round(calcPrice / (1 - discountPercent / 100))
      : discountAmount
        ? calcPrice + discountAmount
        : calcPrice);

  const image =
    offer.mainImage ||
    offer.items?.[0]?.mainImage ||
    '';

  const businessName =
    offer.branch?.name ||
    offer.branchName ||
    offer.business?.name ||
    'Local Business';

  const location =
    offer.branch?.address ||
    offer.business?.address ||
    offer.business?.city ||
    'Nearby';

  const category =
    offer.business?.categoryName ||
    offer.offerType ||
    'Deal';

  const lat = offer.business?.latitude;
  const lng = offer.business?.longitude;

  let discountLabel: string | undefined;
  if (discountPercent) discountLabel = `${discountPercent}% OFF`;
  else if (discountAmount) discountLabel = `${formatNaira(discountAmount)} OFF`;
  else if (dealPrice === 0) discountLabel = 'FREE';
  else if (originalPrice > dealPrice) discountLabel = 'Special Offer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branchAny = offer.branch as Record<string, any>;
  const slug =
    branchAny?.username ||
    branchAny?.uniqueCode ||
    branchAny?.business?.uniqueCode ||
    offer.business?.slug ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (offer.business as Record<string, any>)?.uniqueCode ||
    '';

  const images = (offer.galleryImages?.length
    ? offer.galleryImages
    : image
      ? [image]
      : []);

  return {
    id: offer.id,
    title: offer.name,
    description: offer.description,
    image,
    images,
    businessName,
    businessSlug: slug || undefined,
    category,
    location,
    lat,
    lng,
    originalPrice: originalPrice > dealPrice ? originalPrice : undefined,
    dealPrice,
    discountPercent,
    discountAmount,
    discountLabel,
    endDate: offer.endDate ?? undefined,
    // Always use two-segment path so Next.js matches app/deals/[slug]/[id]
    // and not the catch-all app/[slug]/[code] which loads TapJourneyContainer.
    const dealSlug = slug || offer.businessId || offer.branchId || offer.id;
    href: `/deals/${encodeURIComponent(dealSlug)}/${offer.id}`,
  };
}

export function offersToBusinessCards(offers: DealOffer[]): HomeBusinessCard[] {
  const map = new Map<string, HomeBusinessCard & { _dealCount: number }>();

  for (const offer of offers) {
    const id =
      offer.businessId ||
      offer.branchId ||
      offer.business?.id ||
      offer.branch?.id ||
      offer.id;

    const name =
      offer.branch?.name ||
      offer.branchName ||
      offer.business?.name ||
      'Local Business';

    const image =
      offer.branch?.logoUrl ||
      offer.business?.logo ||
      offer.mainImage ||
      '';

    const location =
      offer.branch?.address ||
      offer.business?.address ||
      offer.business?.city ||
      'Nearby';

    const category = offer.business?.categoryName || 'Business';

    // Only link to the storefront when we have a real business code —
    // a raw UUID (businessId/branchId) will 404 on /b/[code].
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchAny = offer.branch as Record<string, any>;
    const code =
      branchAny?.username ||
      branchAny?.uniqueCode ||
      branchAny?.business?.uniqueCode ||
      offer.business?.slug ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (offer.business as Record<string, any>)?.uniqueCode ||
      '';

    const existing = map.get(id);
    if (existing) {
      existing._dealCount += 1;
      existing.activeDeals = existing._dealCount;
      // Prefer a real code if a later offer in the group carries one.
      if (code && existing.href.startsWith('/deals')) {
        existing.href = `/b/${encodeURIComponent(code)}`;
      }
      continue;
    }

    map.set(id, {
      id,
      name,
      image,
      category,
      location,
      rating: offer.business?.rating,
      activeDeals: 1,
      href: code ? `/b/${encodeURIComponent(code)}` : `/deals?q=${encodeURIComponent(name)}`,
      _dealCount: 1,
    });
  }

  return Array.from(map.values()).map(({ _dealCount: _, ...card }) => card);
}
