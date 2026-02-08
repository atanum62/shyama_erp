'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <main id="dashboard-main" className="flex-1 overflow-auto relative">
                    <DashboardHeader />
                    <div className="p-6 md:p-8 pt-20 md:pt-24">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
