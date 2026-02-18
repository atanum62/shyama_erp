'use client';

import React from 'react';
import { FabricsHeader } from '@/components/layout/FabricsHeader';

export default function FabricsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-6">
            <FabricsHeader />
            <div>
                {children}
            </div>
        </div>
    );
}
