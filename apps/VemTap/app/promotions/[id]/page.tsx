// ====================================================================
// COMMENTED OUT - This page has been merged into /deals/[slug]/[id]
// The /deals/[slug]/[id] page now handles all deal detail functionality.
// All links that previously pointed to /promotions/[id] now point to /deals/[slug]/[id].
// ====================================================================

// 'use client';

// import React, { useState, useMemo, useEffect, useCallback } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { AnimatePresence, motion } from 'framer-motion';
// import {
//     ArrowLeft,
//     Loader2,
//     X,
//     ShieldCheck,
//     ChevronRight,
//     CheckCircle2,
//     Gift,
//     Copy,
// } from 'lucide-react';
// import { MOCK_PROMOTIONS, formatPromoPrice, formatPromoDate, getPromoDaysLeft } from '@/lib/mock/promotions';
// import type { MockPromotion } from '@/lib/mock/promotions';
// import { usePublicOfferDetails, useRequestClaimOtp, useVerifyClaimOtp } from '@/services/deals/hooks';
// import { useEngagement } from '@/services/deals/engagement-hooks';
// import DealEngagementBar from '@/components/deals/DealEngagementBar';
// import ReviewSection from '@/components/deals/ReviewSection';
// import WriteReviewModal from '@/components/deals/WriteReviewModal';
// import ShareDealModal from '@/components/promotions/ShareDealModal';
// import { toast } from 'react-hot-toast';

// ... (rest of the file was 656 lines)

// Redirect to /deals
import { redirect } from 'next/navigation';

export default function PromotionDetailPage() {
    redirect('/deals');
}
