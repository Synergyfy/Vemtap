'use client';

import { ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatConnectModal } from '@/components/visitor/ChatConnectModal';
import { toast } from 'react-hot-toast';

interface AuthGuardProps {
    children: ReactNode;
    onAction: () => void;
    actionLabel?: string;
    businessName?: string;
    logoUrl?: string | null;
}

export default function AuthGuard({
    children,
    onAction,
    actionLabel = 'This action',
    businessName = 'VemTap',
    logoUrl,
}: AuthGuardProps) {
    const { isAuthenticated } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const pendingActionRef = useRef(false);

    // When isAuthenticated flips true while modal is open, close modal + fire action
    useEffect(() => {
        if (isAuthenticated && showAuthModal && pendingActionRef.current) {
            pendingActionRef.current = false;
            setShowAuthModal(false);
            toast.success('Signed in! ' + actionLabel);
            // Small delay to let modal close animation start
            setTimeout(() => onAction(), 150);
        }
    }, [isAuthenticated, showAuthModal, onAction, actionLabel]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isAuthenticated) {
            onAction();
        } else {
            pendingActionRef.current = true;
            setShowAuthModal(true);
        }
    }, [isAuthenticated, onAction]);

    return (
        <>
            <div onClick={handleClick} className="contents">
                {children}
            </div>
            <ChatConnectModal
                isOpen={showAuthModal}
                onClose={() => {
                    pendingActionRef.current = false;
                    setShowAuthModal(false);
                }}
                onSuccess={() => {
                    // The useEffect above handles closing via isAuthenticated change.
                    // This is a fallback in case the store updates before the effect runs.
                }}
                storeName={businessName}
                logoUrl={logoUrl}
                signInTitle="Welcome Back"
                signInSubtitle="Sign in to like, save, and review deals."
                signUpTitle="Join VemTap"
                signUpSubtitle="Create an account to engage with deals."
            />
        </>
    );
}
