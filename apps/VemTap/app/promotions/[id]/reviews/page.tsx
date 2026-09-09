// ====================================================================
// COMMENTED OUT - This page has been merged into /deals/[slug]/[id]/reviews
// The /deals/[slug]/[id]/reviews page now handles all review functionality.
// ====================================================================

// 'use client';

// import { useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { motion } from 'framer-motion';
// import { ArrowLeft, MessageCircle, PenLine, Star, Loader2, ChevronDown } from 'lucide-react';
// import Navbar from '@/components/layout/Navbar';
// import Footer from '@/components/layout/Footer';
// import ReviewCard from '@/components/deals/ReviewCard';
// import WriteReviewModal from '@/components/deals/WriteReviewModal';
// import { useReviews, useEngagement } from '@/services/deals/engagement-hooks';
// import { usePublicOfferDetails } from '@/services/deals/hooks';

// ... (rest of the file was 181 lines)

// Redirect to /deals
import { redirect } from 'next/navigation';

export default function PromotionReviewsPage() {
    redirect('/deals');
}
