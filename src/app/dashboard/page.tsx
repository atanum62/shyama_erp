'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Scissors,
    Truck,
    UserCircle,
    TrendingUp,
    TrendingDown,
    Package,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Shyama ERP Dashboard...</div>;

    const cards = [
        { title: 'Fabric Inward', value: stats?.counts?.inwards || 0, icon: Package, link: '/dashboard/fabrics', color: 'blue' },
        { title: 'Cutting Orders', value: stats?.counts?.cutting || 0, icon: Scissors, link: '/dashboard/cutting', color: 'orange' },
        { title: 'Active Stitching', value: stats?.counts?.stitching || 0, icon: UserCircle, link: '/dashboard/stitching', color: 'purple' },
        { title: 'Daily Dispatches', value: stats?.counts?.delivery || 0, icon: Truck, link: '/dashboard/delivery', color: 'green' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Greeting */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome back, Admin</h1>
                <p className="text-muted text-sm mt-1">Here's a production summary for Shyama ERP (LUX/Rupa Workflow).</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <Link key={idx} href={card.link}>
                            <div className="group bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${card.color}-500/5 rounded-full group-hover:scale-125 transition-transform`} />
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-2xl bg-${card.color}-500/10 text-${card.color}-600`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-3xl font-bold text-foreground">{card.value}</h3>
                                    <p className="text-sm font-medium text-muted uppercase tracking-wider mt-1">{card.title}</p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Financial & WIP Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* WIP Tracking */}
                <div className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border bg-secondary/20 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Production Flow Analysis
                        </h3>
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">LIVE</span>
                    </div>
                    <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div className="space-y-2 text-center">
                            <div className="text-4xl font-black text-primary">{stats?.counts?.inwards}</div>
                            <div className="text-[10px] font-bold text-muted uppercase">Fabric Inward Lots</div>
                            <div className="h-1 bg-secondary rounded-full w-24 mx-auto" />
                        </div>
                        <div className="flex justify-center">
                            <ArrowDownRight className="w-8 h-8 text-muted/30 rotate-[-90deg] hidden md:block" />
                            <ArrowDownRight className="w-8 h-8 text-muted/30 md:hidden" />
                        </div>
                        <div className="space-y-2 text-center">
                            <div className="text-4xl font-black text-orange-600">{stats?.counts?.cutting}</div>
                            <div className="text-[10px] font-bold text-muted uppercase">Orders in Cutting</div>
                            <div className="h-1 bg-orange-100 rounded-full w-24 mx-auto" />
                        </div>
                    </div>
                    <div className="p-6 bg-secondary/10 border-t border-border mt-auto">
                        <div className="flex items-center justify-between text-xs font-bold text-muted">
                            <span>WASTAGE ALLOWED: 2%</span>
                            <span>CURRENT WASTAGE: 1.8%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-orange-500 h-full w-[1.8%]" />
                        </div>
                    </div>
                </div>

                {/* Account Balance */}
                <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
                    <h3 className="font-bold border-b border-border pb-4 flex items-center gap-2 text-sm text-muted uppercase tracking-widest">
                        <TrendingDown className="w-4 h-4 text-primary" />
                        Accounting Overview
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                            <p className="text-[10px] font-bold text-green-600 uppercase">Receivable (from LUX)</p>
                            <h4 className="text-2xl font-black text-foreground mt-1">₹ {stats?.accounting?.receivables?.toLocaleString()}</h4>
                        </div>

                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Payable (to Stitchers)</p>
                            <h4 className="text-2xl font-black text-foreground mt-1">₹ {stats?.accounting?.payables?.toLocaleString()}</h4>
                        </div>

                        <div className="pt-4 mt-4 border-t border-dashed border-border">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-muted uppercase">Pending Approvals</span>
                                <span className="text-orange-500">4 Lots</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold mt-2">
                                <span className="text-muted uppercase">Daily Target</span>
                                <span className="text-green-500">92%</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all mt-4">
                        Generate Monthly Report
                    </button>
                </div>
            </div>
        </div>
    );
}

import { Trash2 } from 'lucide-react';
