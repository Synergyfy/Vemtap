'use client';

import React from 'react';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLockWrapper feature="inventory" featureName="Inventory">
      {children}
    </PageLockWrapper>
  );
}
