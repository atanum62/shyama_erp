'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Database,
    Package,
    Scissors,
    UserCircle,
    Truck,
    IndianRupee,
    FilePieChart,
    ChevronDown,
    Search,
    Ruler,
    Scale,
    RotateCcw,
    ListChecks,
    Settings,
    FileText
} from 'lucide-react';

export function Sidebar() {
    const pathname = usePathname();
    const [isFabricsOpen, setIsFabricsOpen] = useState(false);
    const [isInspectionOpen, setIsInspectionOpen] = useState(false);

    const [displayName, setDisplayName] = useState('SHYAMA ERP');

    // Auto-expand based on current route
    useEffect(() => {
        if (pathname.includes('/dashboard/fabrics')) {
            setIsFabricsOpen(true);
            if (pathname.includes('/dashboard/fabrics/inspection')) {
                setIsInspectionOpen(true);
            }
        }
    }, [pathname]);

    // Fetch branding only once on mount
    useEffect(() => {
        const fetchBranding = () => {
            fetch('/api/system/settings')
                .then(res => res.json())
                .then(data => {
                    if (data.erpName) setDisplayName(data.erpName);
                })
                .catch(err => console.error('Failed to load branding:', err));
        };

        fetchBranding();
    }, []);

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'Masters', href: '/dashboard/masters', icon: Database },
        { name: 'Cutting Orders', href: '/dashboard/cutting', icon: Scissors },
        { name: 'Stitching & QC', href: '/dashboard/stitching', icon: UserCircle },
        { name: 'Delivery', href: '/dashboard/delivery', icon: Truck },
        { name: 'Accounting', href: '/dashboard/accounting', icon: IndianRupee },
        { name: 'Reports', href: '/dashboard/reports', icon: FilePieChart },
        { name: 'System', href: '/dashboard/system', icon: Settings },
    ];

    const fabricsSubMenu = [
        { name: 'Inward', href: '/dashboard/fabrics', icon: ListChecks },
    ];

    const inspectionSubMenu = [
        { name: 'Overview', href: '/dashboard/fabrics/inspection', icon: Search },
        { name: 'Reweight', href: '/dashboard/fabrics/inspection/reweight', icon: Scale },
        { name: 'Return', href: '/dashboard/fabrics/inspection/return', icon: RotateCcw },
    ];

    const isFabricsActive = pathname.startsWith('/dashboard/fabrics');

    return (
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0 pt-4">
            <div className="h-16 flex items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/30">
                        {displayName.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-foreground leading-none uppercase">{displayName}</h2>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Management System</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 py-6 space-y-1.5 custom-scrollbar">
                {menuItems.slice(0, 2).map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1'
                                : 'text-muted hover:bg-secondary hover:text-foreground hover:translate-x-0.5'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary/70'}`} />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Fabrics Dropdown */}
                <div className="space-y-1">
                    <button
                        onClick={() => setIsFabricsOpen(!isFabricsOpen)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isFabricsActive
                            ? 'bg-primary/10 text-primary translate-x-1'
                            : 'text-muted hover:bg-secondary hover:text-foreground hover:translate-x-0.5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Package className={`w-4 h-4 ${isFabricsActive ? 'text-primary' : 'text-primary/70'}`} />
                            Fabrics
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isFabricsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFabricsOpen && (
                        <div className="ml-4 pl-4 border-l border-primary/20 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                            {fabricsSubMenu.map((sub) => {
                                const Icon = sub.icon;
                                const isActive = pathname === sub.href;
                                return (
                                    <Link
                                        key={sub.href}
                                        href={sub.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                                            ? 'text-primary bg-primary/5'
                                            : 'text-muted hover:text-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {sub.name}
                                    </Link>
                                );
                            })}

                            {/* Inspection Sub-Dropdown */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => setIsInspectionOpen(!isInspectionOpen)}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${pathname.includes('/inspection')
                                        ? 'text-orange-600 bg-orange-500/5'
                                        : 'text-muted hover:text-foreground hover:bg-secondary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Search className="w-3.5 h-3.5" />
                                        Inspection
                                    </div>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isInspectionOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isInspectionOpen && (
                                    <div className="ml-3 pl-3 border-l border-orange-500/20 space-y-1 mt-1 animate-in slide-in-from-top-1">
                                        {inspectionSubMenu.map((sub) => {
                                            const Icon = sub.icon;
                                            const isActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isActive
                                                        ? 'text-orange-700 bg-orange-500/10'
                                                        : 'text-muted hover:text-foreground hover:bg-secondary/50'
                                                        }`}
                                                >
                                                    <Icon className="w-3 h-3" />
                                                    {sub.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Cutting Size - Moved here after Inspection */}
                            <Link
                                href="/dashboard/fabrics/cuttingsize"
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${pathname === '/dashboard/fabrics/cuttingsize'
                                    ? 'text-primary bg-primary/5'
                                    : 'text-muted hover:text-foreground hover:bg-secondary/50'
                                    }`}
                            >
                                <Ruler className="w-3.5 h-3.5" />
                                Cutting Size
                            </Link>
                        </div>
                    )}
                </div>

                {menuItems.slice(2).map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1'
                                : 'text-muted hover:bg-secondary hover:text-foreground hover:translate-x-0.5'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary/70'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border mt-auto">
                <div className="bg-secondary/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold text-muted uppercase mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-xs font-bold text-foreground">Cloud Connected</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
