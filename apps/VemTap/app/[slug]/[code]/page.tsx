'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TapJourneyContainer } from '@/components/visitor/TapJourneyContainer';

const DynamicTapJourneyPage = () => {
    const params = useParams();
    const deviceCode = params.code as string;

    return <TapJourneyContainer code={deviceCode} />;
};

export default DynamicTapJourneyPage;
