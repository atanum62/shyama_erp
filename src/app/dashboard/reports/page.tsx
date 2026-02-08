'use client';

import React from 'react';
import { FilePieChart, Download, Filter } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FilePieChart className="w-6 h-6 text-primary" />
                        Production Reports
                    </h1>
                    <p className="text-muted text-sm mt-1">Export manufacturing and financial summaries.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg border border-border text-sm font-bold">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                        <FilePieChart className="w-8 h-8 text-muted" />
                    </div>
                    <h3 className="text-xl font-bold">Monthly Lot Comparison</h3>
                    <p className="text-muted text-sm max-w-xs mt-1">Analyze production volume across different fabric qualities.</p>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                        <FilePieChart className="w-8 h-8 text-muted" />
                    </div>
                    <h3 className="text-xl font-bold">Stitcher Efficiency Report</h3>
                    <p className="text-muted text-sm max-w-xs mt-1">Track rejection rates and timely delivery by external units.</p>
                </div>
            </div>
        </div>
    );
}
