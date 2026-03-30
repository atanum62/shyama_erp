'use client';

import React, { useState } from 'react';
import { 
    Bell, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Clock, 
    Filter, 
    Trash2, 
    Search,
    ChevronRight,
    MailOpen,
    Mail
} from 'lucide-react';

export default function NotificationsPage() {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Inward Lot Approved',
            message: 'Lot #12345 (Maroon) has been fully approved by QC after successful inspection.',
            time: '5 mins ago',
            date: 'March 30, 2026',
            type: 'success',
            unread: true,
            category: 'Inspection'
        },
        {
            id: 2,
            title: 'Low Stock Alert',
            message: 'Interlock 14" DIA (Yellow) is below 50KG threshold. Current stock: 42.5KG. Reordering suggested.',
            time: '2 hours ago',
            date: 'March 30, 2026',
            type: 'warning',
            unread: true,
            category: 'Inventory'
        },
        {
            id: 3,
            title: 'Reweight Correction',
            message: 'Weight mismatch detected in Lot #7435 (Navy). Initial: 200KG, Reweight: 198.5KG. Correction required in ledger.',
            time: 'Yesterday',
            date: 'March 29, 2026',
            type: 'error',
            unread: false,
            category: 'Quality'
        },
        {
            id: 4,
            title: 'New Party Entry',
            message: 'A new dyeing house "Dye-Plus Colors" has been added to the master database.',
            time: '2 days ago',
            date: 'March 28, 2026',
            type: 'info',
            unread: false,
            category: 'Masters'
        },
        {
            id: 5,
            title: 'Monthly Report Generated',
            message: 'The production flow analysis for February 2026 is now available in the reports section.',
            time: '3 days ago',
            date: 'March 27, 2026',
            type: 'info',
            unread: false,
            category: 'Reports'
        }
    ]);

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || (filter === 'unread' && n.unread);
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             n.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Bell className="w-6 h-6 text-primary" />
                        Notification Center
                    </h1>
                    <p className="text-muted text-sm font-medium mt-1">Manage your system alerts and recent activity reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-secondary/50 text-foreground text-xs font-bold uppercase tracking-widest rounded-xl border border-border/50 transition-all hover:bg-secondary flex items-center gap-2"
                    >
                        <MailOpen className="w-3.5 h-3.5" />
                        Mark All Read
                    </button>
                    <button className="px-4 py-2 bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest rounded-xl border border-red-500/20 transition-all hover:bg-red-500/20 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-xl border border-border/50">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === 'unread' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground'}`}
                    >
                        Unread
                    </button>
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary/20 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {filteredNotifications.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-muted" />
                        </div>
                        <p className="text-muted font-bold">No notifications found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredNotifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`p-6 hover:bg-secondary/10 transition-all cursor-pointer group relative ${n.unread ? 'bg-primary/[0.02]' : ''}`}
                            >
                                {n.unread && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                )}
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl shrink-0 ${
                                        n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                        n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                        n.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                         n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                                         n.type === 'error' ? <XCircle className="w-5 h-5" /> :
                                         <Clock className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-sm font-black uppercase tracking-tight ${n.unread ? 'text-foreground' : 'text-white/60'}`}>{n.title}</h3>
                                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                    {n.category}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted whitespace-nowrap">{n.time}</span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${n.unread ? 'text-white/80' : 'text-muted'}`}>
                                            {n.message}
                                        </p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{n.date}</span>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(n.id);
                                                    }}
                                                    className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-all">
                                                    Details
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
