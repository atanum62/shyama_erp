'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function DashboardHeader() {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const mainElement = document.getElementById('dashboard-main');
        if (!mainElement) return;

        const handleScroll = () => {
            const currentScrollY = mainElement.scrollTop;

            // Hide if scrolling down, Show if scrolling up
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                // Scrolling Down
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling Up
                setIsVisible(true);
            }

            // If at the very top, keep it visible
            if (currentScrollY <= 0) {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        mainElement.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainElement.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`h-20 pt-4 border-b border-border bg-background fixed top-0 right-0 z-30 flex items-center justify-between px-6 transition-all duration-300 w-[calc(100%-16rem)] ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
        >
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-foreground">
                    Overview
                </h1>
            </div>

            <div className="flex items-center gap-6 h-full">
                <ThemeToggle />

                <div className="flex items-center gap-4 border-l border-border pl-6 h-8">
                    <div className="text-sm text-right hidden sm:block">
                        <p className="font-medium text-foreground leading-none">{session?.user?.name}</p>
                        <p className="text-[10px] text-muted capitalize mt-1 leading-none">{session?.user?.role}</p>
                    </div>

                    <button
                        suppressHydrationWarning
                        onClick={() => signOut()}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
}
