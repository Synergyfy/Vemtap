'use client';

import { useState } from 'react';
import { useEngagement, useSetReaction, useToggleSave } from '@/services/deals/engagement-hooks';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import AuthGuard from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';

interface DealEngagementBarProps {
  offerId: string;
  offerTitle: string;
  offerDescription: string;
  dealUrl: string;
  businessName?: string;
  compact?: boolean;
}

/* ─── Stitch tokens ─── */
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
  const [showShare, setShowShare] = useState(false);

  const { data: engagement } = useEngagement(offerId);
  const setReaction = useSetReaction(offerId);
  const toggleSave = useToggleSave(offerId);

  const liked = engagement?.type === 'like';
  const saved = engagement?.isSaved ?? false;
  const likesCount = engagement?.likesCount ?? 0;
  const reviewsCount = engagement?.reviewsCount ?? 0;

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Like */}
        <AuthGuard onAction={() => setReaction.mutate('like')} businessName={businessName}>
          <button
            disabled={setReaction.isPending}
            className="flex items-center justify-center transition-colors"
            style={{
              width: compact ? 28 : 32,
              height: compact ? 28 : 32,
              borderRadius: 8,
              color: liked ? C.error : C.onSurfaceVariant,
              background: liked ? '#fef2f2' : 'transparent',
            }}
            aria-label="Like"
          >
            <span className="material-symbols-outlined" style={{ fontSize: compact ? 16 : 18, fontVariationSettings: liked ? "'FILL' 1" : undefined }}>
              favorite
            </span>
          </button>
        </AuthGuard>
        {likesCount > 0 && (
          <span style={{ fontSize: 11, color: C.outline, fontWeight: 500 }}>{likesCount}</span>
        )}

        {/* Comment */}
        <button
          onClick={() => router.push(`/promotions/${offerId}/reviews`)}
          className="flex items-center justify-center transition-colors"
          style={{
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            borderRadius: 8,
            color: C.onSurfaceVariant,
            background: 'transparent',
          }}
          aria-label="Comment"
        >
          <span className="material-symbols-outlined" style={{ fontSize: compact ? 16 : 18 }}>
            chat_bubble
          </span>
        </button>
        {reviewsCount > 0 && (
          <span style={{ fontSize: 11, color: C.outline, fontWeight: 500 }}>{reviewsCount}</span>
        )}

        {/* Save */}
        <AuthGuard onAction={() => toggleSave.mutate()} businessName={businessName}>
          <button
            disabled={toggleSave.isPending}
            className="flex items-center justify-center transition-colors"
            style={{
              width: compact ? 28 : 32,
              height: compact ? 28 : 32,
              borderRadius: 8,
              color: saved ? C.primary : C.onSurfaceVariant,
              background: saved ? '#eff6ff' : 'transparent',
            }}
            aria-label="Save"
          >
            <span className="material-symbols-outlined" style={{ fontSize: compact ? 16 : 18, fontVariationSettings: saved ? "'FILL' 1" : undefined }}>
              bookmark
            </span>
          </button>
        </AuthGuard>

        {/* Share */}
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center justify-center transition-colors"
          style={{
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            borderRadius: 8,
            color: C.onSurfaceVariant,
            background: 'transparent',
          }}
          aria-label="Share"
        >
          <span className="material-symbols-outlined" style={{ fontSize: compact ? 16 : 18 }}>
            share
          </span>
        </button>
      </div>

      <ShareDealModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={offerTitle}
        description={offerDescription}
        url={dealUrl}
      />
    </>
  );
}
