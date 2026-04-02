'use client';

import React, { use } from 'react';
import { 
    Bell, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Clock, 
    ArrowLeft,
    Share2,
    Printer,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [notification, setNotification] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch('/api/notifications/' + id)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNotification(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin"></div>
                <h2 className="text-xl font-bold text-foreground">Loading Detail...</h2>
            </div>
        );
    }

    if (!notification) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Bell className="w-12 h-12 text-muted/30" />
                <h2 className="text-xl font-bold text-foreground">Notification Not Found</h2>
                <Link href="/dashboard/notifications" className="text-primary hover:underline font-bold text-sm uppercase tracking-widest">
                    Return to Center
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Link 
                    href="/dashboard/notifications"
                    className="group flex items-center gap-2 text-sm font-bold text-muted hover:text-white transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Center
                </Link>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-muted hover:text-white hover:bg-secondary/50 rounded-xl transition-all">
                        <Printer className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-muted hover:text-white hover:bg-secondary/50 rounded-xl transition-all">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button className="px-5 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark as Handled
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#0f172a] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">
                {/* Visual Accent */}
                <div className={`h-2 w-full ${
                    notification.type === 'success' ? 'bg-emerald-500' :
                    notification.type === 'warning' ? 'bg-amber-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                }`} />

                <div className="p-10 md:p-14">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                                    notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                    notification.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                    notification.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                    'bg-blue-500/10 text-blue-500'
                                }`}>
                                    {notification.category}
                                </span>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                    {notification.sender}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-white leading-tight flex items-center gap-3 flex-wrap">
                                {notification.title.replace(' (Failed to send Email)', '')}
                                {notification.title.includes('(Failed to send Email)') && (
                                    <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded-full uppercase tracking-widest border border-red-500/20">
                                        Email Delivery Failed
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div className="text-right shrink-0">
                            <p className="text-sm font-black text-white/60 mb-1">{timeAgo(notification.time)}</p>
                            <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{formatDate(notification.date)}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-lg text-white/80 leading-relaxed font-medium">
                                {notification.message}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5 bg-secondary/10 px-8 rounded-2xl">
                            {notification.dynamicDetails && Object.entries(notification.dynamicDetails).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{key}</p>
                                    <p className="text-sm font-bold text-white max-w-[200px] truncate" title={String(value)}>{String(value)}</p>
                                </div>
                            ))}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Priority</p>
                                <p className={`text-sm font-bold capitalize ${
                                    notification.type === 'error' ? 'text-red-500' : 
                                    notification.type === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                    {notification.type === 'error' ? 'High' : 
                                     notification.type === 'warning' ? 'Medium' : 'Normal'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Gradient */}
                <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            <div className="text-center pb-12">
                <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em]">
                    Tex ERP Management System • Notification Archive
                </p>
            </div>
        </div>
    );
}
