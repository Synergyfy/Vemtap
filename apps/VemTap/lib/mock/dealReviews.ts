import { DealReview } from '@/store/useDealEngagementStore';

export const MOCK_DEAL_REVIEWS: Record<string, DealReview[]> = {
    'offer-1': [
        {
            id: 'mock-review-1',
            offerId: 'offer-1',
            reviewerName: 'Chidinma O.',
            comment: 'Amazing deal! Got my order delivered fast and the discount was real. Will definitely use again.',
            likesCount: 12,
            createdAt: Date.now() - 2 * 60 * 60 * 1000,
        },
        {
            id: 'mock-review-2',
            offerId: 'offer-1',
            reviewerName: 'Emeka A.',
            comment: 'Works as described. Customer service was helpful when I had a question.',
            likesCount: 5,
            createdAt: Date.now() - 24 * 60 * 60 * 1000,
        },
        {
            id: 'mock-review-3',
            offerId: 'offer-1',
            reviewerName: 'Fatima B.',
            comment: 'Good value for money. The 10% discount made a real difference.',
            likesCount: 3,
            createdAt: Date.now() - 48 * 60 * 60 * 1000,
        },
    ],
    'offer-2': [
        {
            id: 'mock-review-4',
            offerId: 'offer-2',
            reviewerName: 'Tunde K.',
            comment: 'Love this! The quality is top notch and the price is unbeatable.',
            likesCount: 8,
            createdAt: Date.now() - 3 * 60 * 60 * 1000,
        },
        {
            id: 'mock-review-5',
            offerId: 'offer-2',
            reviewerName: 'Aisha M.',
            comment: 'Quick delivery, will buy again.',
            likesCount: 2,
            createdAt: Date.now() - 12 * 60 * 60 * 1000,
        },
    ],
};

export function getMockReviews(offerId: string): DealReview[] {
    return MOCK_DEAL_REVIEWS[offerId] || [];
}

export function getMockReviewPreview(offerId: string, count = 3): DealReview[] {
    return getMockReviews(offerId).slice(0, count);
}
