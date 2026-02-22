'use client';

import React from 'react';
export default function FabricsLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="space-y-6">
            <div>
                {children}
            </div>
        </div>
    );
}
