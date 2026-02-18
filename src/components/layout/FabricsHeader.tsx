'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    Clock
} from 'lucide-react';

interface Stats {
    pending: number;
    approved: number;
    rejected: number;
    avgTime: string;
}

export function FabricsHeader() {
    const pathname = usePathname();
    const [stats, setStats] = useState<Stats | null>(null);

    // Fetch stats for the header
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/inward');
                const data = await res.json();
                if (Array.isArray(data)) {
                    const allItems = data.flatMap((inward: any) => inward.items || []);
                    setStats({
                        pending: allItems.filter((item: any) => item.status === 'Pending').length,
                        approved: allItems.filter((item: any) => item.status === 'Approved').length,
                        rejected: allItems.filter((item: any) => item.status === 'Rejected').length,
                        avgTime: '2.4 Days'
                    });
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();
    }, [pathname]);

    return (
        <div className="space-y-6 mb-8">
            {/* Stats Grid - Persistent Header for Fabrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase">Pending Inspection</p>
                    <h3 className="text-xl font-bold mt-1 tracking-tight">
                        {stats ? `${stats.pending} Items` : '--'}
                    </h3>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase text-green-600/80">Approved fabric</p>
                    <h3 className="text-xl font-bold mt-1 text-green-600 tracking-tight">
                        {stats ? `${stats.approved} Items` : '--'}
                    </h3>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase text-red-600/80">Rejected fabric</p>
                    <h3 className="text-xl font-bold mt-1 text-red-600 tracking-tight">
                        {stats ? `${stats.rejected} Items` : '--'}
                    </h3>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted uppercase">Avg Approval Time</p>
                        <h3 className="text-xl font-bold mt-1 tracking-tight">
                            {stats ? stats.avgTime : '--'}
                        </h3>
                    </div>
                    <Clock className="text-blue-500 w-5 h-5 opacity-50" />
                </div>
            </div>
        </div>
    );
}
