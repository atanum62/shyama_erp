'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export function DashboardHeader() {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(true);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const lastScrollY = useRef(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications');
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data.slice(0, 5)); // Show only top 5 in dropdown
                }
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };
        fetchNotifications();
    }, []);

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationOpen]);

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

            <div className="flex items-center gap-6 h-full relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`relative p-2 transition-colors rounded-full ${isNotificationOpen ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground hover:bg-muted/10'}`}
                >
                    <Bell className="w-5 h-5" />
                    {notifications.some(n => n.unread) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Recent Mails</h3>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {notifications.filter(n => n.unread).length} New
                            </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted text-xs font-bold italic">
                                    No recent notifications.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((n) => (
                                        <Link
                                            key={n.id}
                                            href={`/dashboard/notifications?id=${n.id}`}
                                            onClick={() => setIsNotificationOpen(false)}
                                            className={`p-4 hover:bg-secondary/20 transition-colors cursor-pointer group block ${n.unread ? 'bg-primary/[0.03]' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' :
                                                        n.type === 'warning' ? 'bg-amber-500' :
                                                            'bg-red-500'
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-black uppercase tracking-tight ${n.unread ? 'text-foreground' : 'text-muted'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed font-medium">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-primary/60 mt-2 flex items-center gap-1.5 uppercase tracking-widest">
                                                        {timeAgo(n.time)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Link
                            href="/dashboard/notifications"
                            onClick={() => setIsNotificationOpen(false)}
                            className="block p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] bg-secondary/50 text-muted hover:text-primary transition-all border-t border-border"
                        >
                            View All History
                        </Link>
                    </div>
                )}

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
