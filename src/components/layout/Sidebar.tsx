'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Database,
    Package,
    Scissors,
    UserCircle,
    Truck,
    IndianRupee,
    FilePieChart
} from 'lucide-react';

export function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'Masters', href: '/dashboard/masters', icon: Database },
        { name: 'Fabric Inward', href: '/dashboard/inward', icon: Package },
        { name: 'Cutting Orders', href: '/dashboard/cutting', icon: Scissors },
        { name: 'Stitching & QC', href: '/dashboard/stitching', icon: UserCircle },
        { name: 'Delivery', href: '/dashboard/delivery', icon: Truck },
        { name: 'Accounting', href: '/dashboard/accounting', icon: IndianRupee },
        { name: 'Reports', href: '/dashboard/reports', icon: FilePieChart },
    ];

    return (
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0 pt-4">
            <div className="h-16 flex items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/30">S</div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-foreground leading-none">SHYAMA ERP</h2>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Manufacturing</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 py-6 space-y-1.5">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
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

            <div className="p-4 border-t border-border">
                <div className="bg-secondary/30 p-4 rounded-2xl">
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
