import { DealReview } from '@/services/deals/types';

export const MOCK_DEAL_REVIEWS: Record<string, DealReview[]> = {
    'offer-1': [
        {
            id: 'mock-review-1',
            offerId: 'offer-1',
            reviewerName: 'Chidinma O.',
            comment: 'Amazing deal! Got my order delivered fast and the discount was real. Will definitely use again.',
            rating: 5,
            likesCount: 12,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'mock-review-2',
            offerId: 'offer-1',
            reviewerName: 'Emeka A.',
            comment: 'Works as described. Customer service was helpful when I had a question.',
            rating: 4,
            likesCount: 5,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'mock-review-3',
            offerId: 'offer-1',
            reviewerName: 'Fatima B.',
            comment: 'Good value for money. The 10% discount made a real difference.',
            rating: 4,
            likesCount: 3,
            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
    ],
    'offer-2': [
        {
            id: 'mock-review-4',
            offerId: 'offer-2',
            reviewerName: 'Tunde K.',
            comment: 'Love this! The quality is top notch and the price is unbeatable.',
            rating: 5,
            likesCount: 8,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'mock-review-5',
            offerId: 'offer-2',
            reviewerName: 'Aisha M.',
            comment: 'Quick delivery, will buy again.',
            rating: 5,
            likesCount: 2,
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
    ],
};

export function getMockReviews(offerId: string): DealReview[] {
    return MOCK_DEAL_REVIEWS[offerId] || [];
}

export function getMockReviewPreview(offerId: string, count = 3): DealReview[] {
    return getMockReviews(offerId).slice(0, count);
}
