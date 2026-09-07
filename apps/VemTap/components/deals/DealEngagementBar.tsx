'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEngagement, useSetReaction, useToggleSave } from '@/services/deals/engagement-hooks';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import WriteReviewModal from '@/components/deals/WriteReviewModal';
import { ChatConnectModal } from '@/components/visitor/ChatConnectModal';

interface DealEngagementBarProps {
  offerId: string;
  offerTitle: string;
  offerDescription: string;
  dealUrl: string;
  businessName?: string;
  compact?: boolean;
}

const C = {
  onSurfaceVariant: '#424655',
  primary: '#0055c4',
  error: '#ba1a1a',
  outline: '#727786',
};

export default function DealEngagementBar({
  offerId,
  offerTitle,
  offerDescription,
  dealUrl,
  businessName = 'Business',
  compact = false,
}: DealEngagementBarProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [showShare, setShowShare] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const { data: engagement } = useEngagement(offerId);
  const setReaction = useSetReaction(offerId);
  const toggleSave = useToggleSave(offerId);

  const liked = engagement?.type === 'like';
  const saved = engagement?.isSaved ?? false;
  const likesCount = engagement?.likesCount ?? 0;
  const reviewsCount = engagement?.reviewsCount ?? 0;
  const sharesCount = 0;

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(n);
  };

  // When the user finishes signing in with the auth modal open, fire the pending action
  useEffect(() => {
    if (isAuthenticated && showAuthModal && pendingActionRef.current) {
      const fn = pendingActionRef.current;
      pendingActionRef.current = null;
      setShowAuthModal(false);
      fn();
    }
  }, [isAuthenticated, showAuthModal]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
      } else {
        pendingActionRef.current = action;
        setShowAuthModal(true);
      }
    },
    [isAuthenticated],
  );

  const performLike = useCallback(() => {
    setReaction.mutate('like');
  }, [setReaction]);

  const performSave = useCallback(() => {
    toggleSave.mutate();
  }, [toggleSave]);

  const performShare = useCallback(() => {
    setShowShare(true);
  }, []);

  const stopClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  const iconSize = compact ? 16 : 18;
  const btnSize = compact ? 28 : 32;

  return (
    <>
      <div className="flex items-center gap-1" onClick={stopClick}>
        {/* Like */}
        <button
          onClick={() => requireAuth(performLike)}
          disabled={setReaction.isPending}
          className="flex items-center justify-center transition-colors"
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: 8,
            color: liked ? C.error : C.onSurfaceVariant,
            background: liked ? '#fef2f2' : 'transparent',
          }}
          aria-label="Like"
        >
          <span className="material-symbols-outlined" style={{ fontSize: iconSize, fontVariationSettings: liked ? "'FILL' 1" : undefined }}>
            favorite
          </span>
        </button>
        <span style={{ fontSize: 11, color: liked ? C.error : C.outline, fontWeight: 500 }}>{formatCount(likesCount)}</span>

        {/* Comment */}
        <button
          onClick={() => requireAuth(() => router.push(`${dealUrl}/reviews`))}
          className="flex items-center justify-center transition-colors"
          style={{ width: btnSize, height: btnSize, borderRadius: 8, color: C.onSurfaceVariant, background: 'transparent' }}
          aria-label="Comment"
        >
          <span className="material-symbols-outlined" style={{ fontSize: iconSize }}>
            chat_bubble
          </span>
        </button>
        <span style={{ fontSize: 11, color: C.outline, fontWeight: 500 }}>{formatCount(reviewsCount)}</span>

        {/* Save */}
        <button
          onClick={() => requireAuth(performSave)}
          disabled={toggleSave.isPending}
          className="flex items-center justify-center transition-colors"
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: 8,
            color: saved ? C.primary : C.onSurfaceVariant,
            background: saved ? '#eff6ff' : 'transparent',
          }}
          aria-label="Save"
        >
          <span className="material-symbols-outlined" style={{ fontSize: iconSize, fontVariationSettings: saved ? "'FILL' 1" : undefined }}>
            bookmark
          </span>
        </button>

        {/* Share */}
        <button
          onClick={() => requireAuth(performShare)}
          className="flex items-center justify-center transition-colors"
          style={{ width: btnSize, height: btnSize, borderRadius: 8, color: C.onSurfaceVariant, background: 'transparent' }}
          aria-label="Share"
        >
          <span className="material-symbols-outlined" style={{ fontSize: iconSize }}>
            share
          </span>
        </button>
        <span style={{ fontSize: 11, color: C.outline, fontWeight: 500 }}>{formatCount(sharesCount)}</span>
      </div>

      <ShareDealModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={offerTitle}
        description={offerDescription}
        url={dealUrl}
      />

      <WriteReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        offerId={offerId}
        businessName={businessName}
      />

      <ChatConnectModal
        isOpen={showAuthModal}
        onClose={() => {
          pendingActionRef.current = null;
          setShowAuthModal(false);
        }}
        onSuccess={() => {}}
        storeName={businessName}
        signInTitle="Welcome Back"
        signInSubtitle="Sign in to like, save, and review deals."
        signUpTitle="Join VemTap"
        signUpSubtitle="Create an account to engage with deals."
      />
    </>
  );
}