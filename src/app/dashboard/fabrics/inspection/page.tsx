'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    Edit,
    X,
    AlertCircle,
    CheckCircle,
    Maximize2,
    Eye,
    RotateCcw,
    Download,
    FileText,
    Loader2,
    FileImage,
    Scale,
    ArrowRight,
    ClipboardList,
    ArrowUp,
    ArrowDown,
    TrendingUp,
    TrendingDown,
    Package,
    Activity,
    Calendar,
    BarChart2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ArrowUpRight
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ReweightModal } from '@/components/fabric/ReweightModal';
import { GsmInputModal } from '@/components/fabric/GsmInputModal';

export default function FabricInspectionPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [parties, setParties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParty, setSelectedParty] = useState('All');
    const [expandedLots, setExpandedLots] = useState<{ [key: string]: boolean }>({});

    // Rejection Modal State
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [selectedInwardId, setSelectedInwardId] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    // Big View State
    const [viewingSpecificColor, setViewingSpecificColor] = useState<{
        inwardId: string;
        lotNo: string;
        color: string;
        items: any[];
    } | null>(null);

    // Multi-select State
    const [selectedColors, setSelectedColors] = useState<Record<string, string[]>>({});

    // GSM Modal State
    const [isGsmModalOpen, setIsGsmModalOpen] = useState(false);
    const [gsmTarget, setGsmTarget] = useState<{
        inwardId: string;
        itemIds: string[];
        isIndividual?: boolean;
    } | null>(null);

    // Full Inward Report State
    const [viewingFullInward, setViewingFullInward] = useState<any | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [systemSettings, setSystemSettings] = useState<any>(null);

    // Reweight State
    const [isReweightModalOpen, setIsReweightModalOpen] = useState(false);
    const [reweightItem, setReweightItem] = useState<any>(null);
    const [viewingReweightHistory, setViewingReweightHistory] = useState<any | null>(null);
    const [timePeriod, setTimePeriod] = useState('1M');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Dashboard Analytics Logic
    const dashboardStats = useMemo(() => {
        if (!inwards.length) return null;

        // Pending Lots: unique inwards that have at least one pending item
        const pendingLots = inwards.filter(inv => inv.items?.some((it: any) => it.status === 'Pending'));
        const pendingLotsCount = pendingLots.length;

        // Total Pending Weight
        const totalPendingWeight = inwards.reduce((acc, inv) => {
            const lotPendingWeight = inv.items?.filter((it: any) => it.status === 'Pending')
                .reduce((a: number, c: any) => a + (Number(c.quantity) || 0), 0) || 0;
            return acc + lotPendingWeight;
        }, 0);

        // Period filter logic
        const now = new Date();
        let daysToLookBack = 30;
        if (timePeriod === '7D') daysToLookBack = 7;
        else if (timePeriod === '3M') daysToLookBack = 90;
        else if (timePeriod === '6M') daysToLookBack = 180;
        else if (timePeriod === '1Y') daysToLookBack = 365;

        const startDate = new Date();
        startDate.setDate(now.getDate() - daysToLookBack);

        const periodInwards = inwards.filter(inv => new Date(inv.inwardDate) >= startDate);

        // Approved Lots: Fully processed and all items approved
        const approvedLotsCount = periodInwards.filter(inv =>
            inv.items?.length > 0 && inv.items.every((it: any) => it.status === 'Approved')
        ).length;

        // Rejected Color Batches: Unique color groupings in lots that have rejected items
        let rejectedColorBatchesCount = 0;
        periodInwards.forEach(inv => {
            const colorGroups = inv.items?.reduce((acc: any, it: any) => {
                const color = it.color || 'Unknown';
                if (!acc[color]) acc[color] = [];
                acc[color].push(it);
                return acc;
            }, {});

            if (colorGroups) {
                Object.values(colorGroups).forEach((items: any) => {
                    // If any item in the color group is rejected, we count it as a rejected color batch
                    if (items.some((it: any) => it.status === 'Rejected')) {
                        rejectedColorBatchesCount++;
                    }
                });
            }
        });

        return {
            pendingLotsCount,
            totalPendingWeight: totalPendingWeight.toFixed(1),
            approvedLotsCount,
            rejectedColorBatchesCount,
            totalProcessedLots: periodInwards.length
        };
    }, [inwards, timePeriod]);

    const toggleColorSelection = (inwardId: string, color: string) => {
        setSelectedColors(prev => {
            const current = prev[inwardId] || [];
            const isSelected = current.includes(color);
            return {
                ...prev,
                [inwardId]: isSelected
                    ? current.filter(c => c !== color)
                    : [...current, color]
            };
        });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [inRes, sRes, pRes] = await Promise.all([
                fetch('/api/inward'),
                fetch('/api/system/settings'),
                fetch('/api/masters/parties')
            ]);
            const [inData, sData, pData] = await Promise.all([
                inRes.json(),
                sRes.json(),
                pRes.json()
            ]);
            setInwards(Array.isArray(inData) ? inData : []);
            setSystemSettings(sData);
            setParties(Array.isArray(pData) ? pData.filter((p: any) => p.type === 'DyeingHouse' || p.type === 'Dyeing House') : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Received': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'Inspection': return <Search className="w-4 h-4 text-blue-500" />;
            case 'Approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const handleUpdateStatus = async (id: string, itemId: string, status: string, rejectionCause?: string, gsm?: number) => {
        try {
            const res = await fetch(`/api/inward/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionCause, itemId, gsm })
            });
            if (res.ok) {
                fetchData();
                setIsRejectionModalOpen(false);
                setSelectedInwardId(null);
                setSelectedItemIds([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectWithCause = async (id: string, itemIds: string[], cause: string) => {
        try {
            const inward = inwards.find(i => i._id === id);
            if (!inward) return;

            const updatedItems = inward.items.map((item: any) => {
                if (itemIds.includes(item._id)) {
                    return { ...item, status: 'Rejected', rejectionCause: cause };
                }
                return item;
            });

            const res = await fetch(`/api/inward/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...inward, items: updatedItems })
            });

            if (res.ok) {
                fetchData();
                setIsRejectionModalOpen(false);
                setSelectedInwardId(null);
                setSelectedItemIds([]);
            }
        } catch (err) {
            console.error('Rejection update failed:', err);
        }
    };

    const handleBulkStatusUpdate = async (inwardId: string, itemIds: string[], status: string, gsm?: number) => {
        if (!itemIds.length) return;

        try {
            // Find the inward from current state
            const inward = inwards.find(i => i._id === inwardId);
            if (!inward) return;

            // Prepare the updated items array
            const updatedItems = inward.items.map((item: any) => {
                if (itemIds.includes(item._id)) {
                    return { ...item, status, rejectionCause: '', gsm: gsm || item.gsm };
                }
                return item;
            });

            // Call PUT with the full updated document to ensure atomic update of the array
            const res = await fetch(`/api/inward/${inwardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...inward, items: updatedItems })
            });

            if (res.ok) {
                fetchData();
                // Clear selections after bulk action
                setSelectedColors(prev => ({ ...prev, [inwardId]: [] }));
            }
        } catch (err) {
            console.error('Bulk update failed:', err);
        }
    };

    const initiateApproval = (id: string, itemIds: string | string[], isIndividual = false) => {
        const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
        setGsmTarget({ inwardId: id, itemIds: ids, isIndividual });
        setIsGsmModalOpen(true);
    };

    const handleConfirmApprove = async (gsm: number) => {
        if (!gsmTarget) return;

        if (gsmTarget.isIndividual) {
            await handleUpdateStatus(gsmTarget.inwardId, gsmTarget.itemIds[0], 'Approved', '', gsm);
        } else {
            await handleBulkStatusUpdate(gsmTarget.inwardId, gsmTarget.itemIds, 'Approved', gsm);
        }

        setIsGsmModalOpen(false);
        setGsmTarget(null);
    };

    const openRejectionModal = (id: string, ids: string | string[]) => {
        setSelectedInwardId(id);
        setSelectedItemIds(Array.isArray(ids) ? ids : [ids]);
        setIsRejectionModalOpen(true);
    };

    const handleDownloadPDF = async () => {
        if (!viewingFullInward) return;
        setIsDownloading(true);
        try {
            const element = document.getElementById('printable-report');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const allElements = clonedDoc.getElementsByTagName('*');
                    const modernColorRegex = /(oklch|oklab|lab|color-mix|light-dark|color\()/i;

                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i] as HTMLElement;
                        try {
                            const style = window.getComputedStyle(el);
                            const props = [
                                'color', 'backgroundColor', 'borderColor', 'outlineColor',
                                'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
                                'fill', 'stroke'
                            ];

                            props.forEach(prop => {
                                const val = style.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
                                if (val && modernColorRegex.test(val)) {
                                    let fallback = '#000000';
                                    if (prop === 'backgroundColor') fallback = '#ffffff';
                                    el.style.setProperty(prop, fallback, 'important');
                                }
                            });
                        } catch (e) { }
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Inspection_Report_Lot_${viewingFullInward.lotNo || 'N/A'}.pdf`);
        } catch (err) {
            console.error('PDF Download failed:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleReweightUpdate = async (inwardId: string, itemId: string, newWeight: number) => {
        try {
            const res = await fetch(`/api/inward/${inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Pending',
                    rejectionCause: '',
                    itemId: itemId,
                    quantity: newWeight
                })
            });
            if (res.ok) {
                fetchData();
                setViewingSpecificColor(null);
            }
        } catch (err) {
            console.error('Reweight update failed:', err);
            throw err;
        }
    };

    const filteredInwards = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return inwards.filter(inward => {
            // Robust party ID check
            const inwardPartyId = inward.partyId?._id || inward.partyId;
            const matchesParty = selectedParty === 'All' || inwardPartyId === selectedParty;

            const matchesSearch = (
                inward.lotNo?.toLowerCase().includes(query) ||
                inward.challanNo?.toLowerCase().includes(query) ||
                (typeof inward.partyId === 'object' && inward.partyId?.name?.toLowerCase().includes(query)) ||
                inward.items.some((item: any) =>
                    item.color?.toLowerCase().includes(query) ||
                    item.materialId?.name?.toLowerCase().includes(query)
                )
            );
            return matchesSearch && matchesParty;
        });
    }, [inwards, searchTerm, selectedParty]);

    const paginatedInwards = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredInwards.slice(start, start + rowsPerPage);
    }, [filteredInwards, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredInwards.length / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Fabric Inspection Overview</h1>
                    <p className="text-muted text-sm font-medium">Review quality control and approve/reject received fabric batches.</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border/50 shrink-0">
                    {['7D', '1M', '3M', '6M', '1Y'].map((p) => (
                        <button
                            suppressHydrationWarning
                            key={p}
                            onClick={() => setTimePeriod(p)}
                            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timePeriod === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:bg-secondary hover:text-foreground'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inspection Analytics Grid */}
            {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    {/* Pending Lots */}
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="text-[10px] font-bold text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded-full uppercase">Waiting</div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.pendingLotsCount} <span className="text-[10px] text-muted font-bold">Lots</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Pending Inspection</p>
                    </div>

                    {/* Pending Weight */}
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                                <Package className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.totalPendingWeight} <span className="text-[10px] text-muted font-bold">KG</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Total Pending Volume</p>
                    </div>

                    {/* Approved Lots in Period */}
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase">Full Pass</div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.approvedLotsCount} <span className="text-[10px] text-muted font-bold">Lots</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Approved Lots ({timePeriod})</p>
                    </div>

                    {/* Rejected Color Batches */}
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-red-500/10 text-red-600 rounded-xl">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="text-[10px] font-bold text-red-600 bg-red-500/5 px-2 py-0.5 rounded-full uppercase">QC Failed</div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.rejectedColorBatchesCount} <span className="text-[10px] text-muted font-bold">Batches</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Rejected Color Batches ({timePeriod})</p>
                    </div>
                </div>
            )}

            {/* Controls Bar: Rows, Filter, Search */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">Rows:</span>
                            <select
                                suppressHydrationWarning
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="bg-card border border-border rounded-lg text-xs font-black p-1 focus:outline-none"
                            >
                                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border">
                            <Filter className="w-3.5 h-3.5 text-muted" />
                            <select
                                suppressHydrationWarning
                                value={selectedParty}
                                onChange={(e) => setSelectedParty(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer pr-4"
                            >
                                <option value="All">All Dyeing Houses</option>
                                {parties.map(p => <option key={p._id} value={p._id || p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-6">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                suppressHydrationWarning
                                type="text"
                                placeholder="Search challan or party..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-secondary/20 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {totalPages > 1 && (
                            <div className="hidden lg:flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest mr-2 leading-none whitespace-nowrap">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        suppressHydrationWarning
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        suppressHydrationWarning
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Lot</th>
                                <th className="px-6 py-4">Inward Date</th>
                                <th className="px-6 py-4">Dyeing House</th>
                                <th className="px-6 py-4">Consignment</th>
                                <th className="px-6 py-4 text-right">Batch Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-muted">Loading transactions...</td></tr>
                            ) : filteredInwards.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center">
                                    <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">No entries found matching your search.</p>
                                </td></tr>
                            ) : paginatedInwards.map((inward) => (
                                <React.Fragment key={inward._id}>
                                    <tr className="bg-secondary/5 group border-t-8 border-white first:border-0 hover:bg-secondary/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    suppressHydrationWarning
                                                    onClick={() => setExpandedLots(prev => ({ ...prev, [inward._id]: !prev[inward._id] }))}
                                                    className={`p-1 rounded-lg transition-all ${expandedLots[inward._id] ? 'bg-primary text-white' : 'bg-white border border-border text-muted hover:text-primary'}`}
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedLots[inward._id] ? '' : '-rotate-90'}`} />
                                                </button>
                                                <div className="font-black text-foreground text-sm tracking-tight">{inward.lotNo || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] text-muted font-black bg-white border border-gray-100 px-2 py-0.5 rounded shadow-sm">{new Date(inward.inwardDate).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-primary font-black uppercase tracking-tighter">#{inward.challanNo}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-foreground">{inward.partyId?.name || 'Unknown'}</div>
                                            <div className="text-[9px] text-muted font-bold uppercase">Authorized Supplier</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-black text-primary">
                                                    {inward.items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0).toFixed(2)} KG
                                                </div>
                                                {inward.items.some((it: any) => it.history?.some((h: any) => h.action === 'Reweighted')) && (
                                                    <button
                                                        onClick={() => setViewingReweightHistory(inward)}
                                                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                                                    >
                                                        <Scale className="w-2.5 h-2.5" />
                                                        Reweighted
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="text-[9px] text-muted font-medium italic">
                                                    Updated: {new Date(inward.updatedAt).toLocaleTimeString()}
                                                </div>

                                                <button
                                                    onClick={() => setViewingFullInward(inward)}
                                                    className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary rounded-lg transition-all shadow-sm flex items-center gap-2 group/report"
                                                    title="View Full Inspection Report"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Report</span>
                                                </button>

                                                {/* Selected Colors Bulk Actions */}
                                                {selectedColors[inward._id]?.length > 1 && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const colorsToApprove = selectedColors[inward._id];
                                                                const itemsToApprove = inward.items
                                                                    .filter((item: any) => colorsToApprove.includes(item.color) && item.status === 'Pending')
                                                                    .map((item: any) => item._id);
                                                                initiateApproval(inward._id, itemsToApprove);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Approve {selectedColors[inward._id].length} Colors
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const colorsToReject = selectedColors[inward._id];
                                                                const itemsToReject = inward.items
                                                                    .filter((item: any) => colorsToReject.includes(item.color) && item.status === 'Pending')
                                                                    .map((item: any) => item._id);
                                                                if (itemsToReject.length > 0) {
                                                                    openRejectionModal(inward._id, itemsToReject);
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Reject {selectedColors[inward._id].length} Colors
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Lot Bulk Actions */}
                                                {inward.items.some((item: any) => item.status === 'Pending') && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const pendingIds = inward.items
                                                                    .filter((item: any) => item.status === 'Pending')
                                                                    .map((item: any) => item._id);
                                                                initiateApproval(inward._id, pendingIds);
                                                            }}
                                                            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                                        >
                                                            Approve Entire Lot
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const pendingIds = inward.items
                                                                    .filter((item: any) => item.status === 'Pending')
                                                                    .map((item: any) => item._id);
                                                                if (pendingIds.length > 0) openRejectionModal(inward._id, pendingIds);
                                                            }}
                                                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                                        >
                                                            Reject Entire Lot
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedLots[inward._id] && (
                                        <tr className="bg-white/40 border-b border-gray-100">
                                            <td colSpan={5} className="px-6 py-6 pt-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
                                                    {Object.entries(
                                                        inward.items.reduce((acc: any, item: any) => {
                                                            const color = item.color || 'Unknown';
                                                            if (!acc[color]) acc[color] = { color, items: [], totalQty: 0, totalPcs: 0 };
                                                            acc[color].items.push(item);
                                                            acc[color].totalQty += Number(item.quantity) || 0;
                                                            acc[color].totalPcs += Number(item.pcs) || 0;
                                                            return acc;
                                                        }, {})
                                                    ).sort().map(([colorName, group]: [string, any]) => {
                                                        const isSelected = (selectedColors[inward._id] || []).includes(colorName);
                                                        return (
                                                            <div
                                                                key={colorName}
                                                                onClick={(e) => {
                                                                    // Prevent interaction with buttons, but allow selection by clicking the card
                                                                    if ((e.target as HTMLElement).closest('button')) return;
                                                                    toggleColorSelection(inward._id, colorName);
                                                                }}
                                                                className={`bg-white border-2 border-l-[6px] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group/card cursor-pointer relative ${isSelected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100 hover:border-primary/20'
                                                                    }`}
                                                                style={{ borderLeftColor: colorName.toLowerCase() }}
                                                            >
                                                                {/* Selection Pulse Indicator */}
                                                                {isSelected && (
                                                                    <div className="absolute top-2 right-2 z-10">
                                                                        <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                                                                            <CheckCircle className="w-3 h-3" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Card Header with Batch Actions */}
                                                                <div className="p-4 border-b border-gray-50 bg-gray-50/40 flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: colorName.toLowerCase() }} />
                                                                        <div>
                                                                            <div className="text-[12px] font-black text-gray-900 uppercase leading-none">{colorName}</div>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <div className="text-[9px] font-bold text-primary">{group.totalQty.toFixed(2)} KG</div>
                                                                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                <div className="text-[9px] font-bold text-blue-600">{group.totalPcs} PCS</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <button
                                                                            onClick={() => setViewingSpecificColor({
                                                                                inwardId: inward._id,
                                                                                lotNo: inward.lotNo,
                                                                                color: colorName,
                                                                                items: group.items
                                                                            })}
                                                                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                                                                            title="Big View"
                                                                        >
                                                                            <Maximize2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        {group.items.some((item: any) => item.status === 'Pending') && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const pendingIds = group.items
                                                                                            .filter((item: any) => item.status === 'Pending')
                                                                                            .map((item: any) => item._id);
                                                                                        initiateApproval(inward._id, pendingIds);
                                                                                    }}
                                                                                    className="group/btn p-1.5 flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                                                                                    title="Approve All Color"
                                                                                >
                                                                                    <CheckCircle className="w-4 h-4" />
                                                                                    <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[80px] transition-all duration-300 text-[8px] font-black whitespace-nowrap">ALL ENTRIES</span>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const pendingIds = group.items
                                                                                            .filter((item: any) => item.status === 'Pending')
                                                                                            .map((item: any) => item._id);
                                                                                        if (pendingIds.length > 0) openRejectionModal(inward._id, pendingIds);
                                                                                    }}
                                                                                    className="group/btn p-1.5 flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                                                                                    title="Reject All Color"
                                                                                >
                                                                                    <XCircle className="w-4 h-4" />
                                                                                    <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[80px] transition-all duration-300 text-[8px] font-black whitespace-nowrap">ALL ENTRIES</span>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {group.items.some((item: any) => item.status !== 'Pending') && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const allIds = group.items.map((item: any) => item._id);
                                                                                    handleBulkStatusUpdate(inward._id, allIds, 'Pending');
                                                                                }}
                                                                                className="group/btn p-1.5 flex items-center gap-1 bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                                                                                title="Reset All to Pending"
                                                                            >
                                                                                <RotateCcw className="w-4 h-4" />
                                                                                <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[80px] transition-all duration-300 text-[8px] font-black whitespace-nowrap">RESET ALL</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                                                                    {group.items.map((item: any, i: number) => (
                                                                        <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-white border border-transparent hover:border-gray-200 transition-all group/item">
                                                                            <div>
                                                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.materialId?.name || 'Fabric'}</div>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="text-[11px] font-black text-gray-800">{item.diameter}" DIA</span>
                                                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                    <span className="text-[11px] font-black text-primary">{item.quantity} KG</span>
                                                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                    <span className="text-[11px] font-black text-blue-600">{item.pcs} PCS</span>
                                                                                    {item.gsm > 0 && (
                                                                                        <>
                                                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                            <span className="text-[11px] font-black text-orange-600 uppercase">{item.gsm} GSM</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${item.status === 'Approved' ? 'bg-emerald-500 text-white' :
                                                                                    item.status === 'Rejected' ? 'bg-red-500 text-white' :
                                                                                        'bg-amber-500 text-white shadow-sm shadow-amber-200 animate-pulse'
                                                                                    }`}>
                                                                                    {item.status}
                                                                                </div>

                                                                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                                    {item.status !== 'Approved' && (
                                                                                        <button onClick={() => initiateApproval(inward._id, item._id, true)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="Approve">
                                                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                    {item.status === 'Rejected' && item.rejectionCause === 'Weight' && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setReweightItem({ ...item, inwardId: inward._id, challanNo: inward.challanNo });
                                                                                                setIsReweightModalOpen(true);
                                                                                            }}
                                                                                            className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                                                            title="Reweight"
                                                                                        >
                                                                                            <Scale className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                    {item.status !== 'Rejected' && (
                                                                                        <button onClick={() => openRejectionModal(inward._id, item._id)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-600 hover:text-white transition-all" title="Reject">
                                                                                            <XCircle className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                    {item.status !== 'Pending' && (
                                                                                        <button onClick={() => handleUpdateStatus(inward._id, item._id, 'Pending')} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-all" title="Reset to Pending">
                                                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {/* Lot Separator Row */}
                                    <tr>
                                        <td colSpan={5} className="p-0">
                                            <div className="h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2 opacity-50" />
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <GsmInputModal
                    isOpen={isGsmModalOpen}
                    onClose={() => {
                        setIsGsmModalOpen(false);
                        setGsmTarget(null);
                    }}
                    onConfirm={handleConfirmApprove}
                    title={gsmTarget?.isIndividual ? "Confirm GSM for Item" : "Confirm GSM for Entire Lot"}
                />

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border bg-secondary/10 flex items-center justify-between">
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredInwards.length)} of {filteredInwards.length} lots
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-border rounded-xl bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1.5">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-y-[-2px]' : 'bg-card border border-border text-muted hover:bg-secondary active:scale-95'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        pageNum === 2 ||
                                        pageNum === totalPages - 1
                                    ) {
                                        return <span key={pageNum} className="text-muted text-[10px] font-black mx-0.5">...</span>;
                                    }
                                    return null;
                                }).filter(Boolean).reduce((acc: any[], curr: any, idx, arr) => {
                                    if (curr.type === 'span' && arr[idx - 1]?.type === 'span') return acc;
                                    return [...acc, curr];
                                }, [])}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-border rounded-xl bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Rejection Cause Modal */}
            {
                isRejectionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsRejectionModalOpen(false)} />
                        <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    Rejection Cause
                                </h3>
                                <button onClick={() => setIsRejectionModalOpen(false)} className="p-1 hover:bg-secondary rounded-md">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-muted mb-6">Please specify the primary reason for rejecting this fabric batch.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => selectedInwardId && selectedItemIds.length > 0 && handleRejectWithCause(selectedInwardId, selectedItemIds, 'Color')}
                                    className="flex flex-col items-center gap-3 p-4 border border-border rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                        <Edit className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">Color Mismatch</span>
                                </button>
                                <button
                                    onClick={() => selectedInwardId && selectedItemIds.length > 0 && handleRejectWithCause(selectedInwardId, selectedItemIds, 'Weight')}
                                    className="flex flex-col items-center gap-3 p-4 border border-border rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">Weight Issue</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setIsRejectionModalOpen(false)}
                                className="w-full mt-6 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }
            {/* Big View Color Management Modal */}
            {
                viewingSpecificColor && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setViewingSpecificColor(null)} />
                        <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl border-4 border-white shadow-xl flex-shrink-0" style={{ backgroundColor: viewingSpecificColor.color.toLowerCase() }} />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">LOT {viewingSpecificColor.lotNo}</span>
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Inspection Mode</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{viewingSpecificColor.color} Management</h2>
                                    </div>
                                </div>
                                <button onClick={() => setViewingSpecificColor(null)} className="p-3 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-gray-100 active:scale-90">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                <div className="grid grid-cols-1 gap-4">
                                    {viewingSpecificColor.items.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all group/bigitem">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-gray-100 text-gray-400 font-bold shadow-inner">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{item.materialId?.name || 'Standard Fabric'}</div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black text-gray-900">{item.diameter}" DIAMETER</span>
                                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                        <span className="text-xl font-black text-primary">{item.quantity} KG</span>
                                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                        <span className="text-xl font-black text-blue-600">{item.pcs} PCS</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-black/10 transition-all ${item.status === 'Approved' ? 'bg-emerald-500 text-white' :
                                                    item.status === 'Rejected' ? 'bg-red-500 text-white' :
                                                        'bg-amber-500 text-white shadow-amber-200 animate-pulse'
                                                    }`}>
                                                    {item.status}
                                                </div>

                                                <div className="flex gap-2">
                                                    {item.status !== 'Approved' && (
                                                        <button
                                                            onClick={async () => {
                                                                await handleUpdateStatus(viewingSpecificColor.inwardId, item._id, 'Approved');
                                                                setViewingSpecificColor(prev => prev ? { ...prev, items: prev.items.map(it => it._id === item._id ? { ...it, status: 'Approved' } : it) } : null);
                                                            }}
                                                            className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <CheckCircle className="w-6 h-6" />
                                                        </button>
                                                    )}
                                                    {item.status !== 'Rejected' && (
                                                        <button
                                                            onClick={() => {
                                                                openRejectionModal(viewingSpecificColor.inwardId, item._id);
                                                                // We close big view to handle rejection cause modal which is z-50
                                                                setViewingSpecificColor(null);
                                                            }}
                                                            className="p-3 bg-red-100 text-red-700 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <XCircle className="w-6 h-6" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                <div className="text-sm font-bold text-gray-500">
                                    Total Varieties for {viewingSpecificColor.color}: <span className="text-gray-900">{viewingSpecificColor.items.length} Units</span>
                                </div>
                                <div className="flex gap-4">
                                    {viewingSpecificColor.items.some(i => i.status === 'Pending') && (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    const pendingIds = viewingSpecificColor.items
                                                        .filter(i => i.status === 'Pending')
                                                        .map(i => i._id);
                                                    handleBulkStatusUpdate(viewingSpecificColor.inwardId, pendingIds, 'Approved');
                                                    setViewingSpecificColor(null);
                                                }}
                                                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 group/btn flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Approve All {viewingSpecificColor.color}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const pendingIds = viewingSpecificColor.items
                                                        .filter(i => i.status === 'Pending')
                                                        .map(i => i._id);
                                                    openRejectionModal(viewingSpecificColor.inwardId, pendingIds);
                                                    setViewingSpecificColor(null);
                                                }}
                                                className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 group/btn flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject All {viewingSpecificColor.color}
                                            </button>
                                        </div>
                                    )}
                                    {viewingSpecificColor.items.some(item => item.status !== 'Pending') && (
                                        <button
                                            onClick={() => {
                                                const allIds = viewingSpecificColor.items.map(item => item._id);
                                                handleBulkStatusUpdate(viewingSpecificColor.inwardId, allIds, 'Pending');
                                                setViewingSpecificColor(null);
                                            }}
                                            className="px-8 py-3 bg-gray-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-600 transition-all active:scale-95 group/btn flex items-center gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Reset All {viewingSpecificColor.color} to Pending
                                        </button>
                                    )}
                                    <button onClick={() => setViewingSpecificColor(null)} className="px-8 py-3 bg-white text-gray-400 font-bold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all active:scale-95">
                                        Close Management
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Full Lot Inspection Report Modal */}
            {viewingFullInward && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setViewingFullInward(null)} />
                    <div className="relative bg-card w-full max-w-5xl h-[90vh] rounded-md shadow-2xl border border-border overflow-hidden animate-in zoom-in duration-300 flex flex-col">

                        {/* Print Styles */}
                        <style>{`
                            @media print {
                                @page {
                                    size: A4;
                                    margin: 0;
                                }
                                body {
                                    margin: 0;
                                    -webkit-print-color-adjust: exact;
                                }
                                .no-print {
                                    display: none !important;
                                }
                                .fixed.inset-0 {
                                    position: relative !important;
                                    display: block !important;
                                    z-index: auto !important;
                                }
                                .absolute.inset-0 {
                                    display: none !important;
                                }
                                .relative.bg-card {
                                    position: relative !important;
                                    box-shadow: none !important;
                                    border: none !important;
                                    width: 100% !important;
                                    max-width: none !important;
                                    height: auto !important;
                                    display: block !important;
                                    overflow: visible !important;
                                }
                                #printable-report {
                                    width: 100% !important;
                                    padding: 15mm !important;
                                    margin: 0 !important;
                                }
                            }
                        `}</style>

                        {/* Print Header Controls */}
                        <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between no-print">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloading}
                                    className="px-4 py-2 bg-black text-white rounded-md text-xs font-bold shadow-lg shadow-black/20 flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all font-inter"
                                >
                                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    {isDownloading ? 'Generating PDF...' : 'Download Report'}
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-white text-black border border-black/10 rounded-md text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-all font-inter"
                                >
                                    <FileImage className="w-4 h-4 text-primary" />
                                    Print A4
                                </button>
                            </div>
                            <button onClick={() => setViewingFullInward(null)} className="p-2 hover:bg-card rounded-md border border-border">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>

                        <div id="printable-report" className="flex-1 overflow-y-auto p-12 space-y-12 bg-white text-black max-w-[210mm] mx-auto w-full font-inter">
                            {/* Company Header */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-8">
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black tracking-tighter text-black">{systemSettings?.companyName || 'SHYAMA INDUSTRIES'}</h1>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Fabric Inspection & Quality Control Report</div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-2">LOT REPORT</div>
                                    <div className="text-2xl font-black tracking-tighter">#{viewingFullInward.lotNo || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Lot Meta Summary */}
                            <div className="grid grid-cols-3 gap-12 py-8 border-b border-gray-100">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Dyeing House / Party</p>
                                    <p className="font-black text-lg">{viewingFullInward.partyId?.name || 'Internal/Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Date of Receipt</p>
                                    <p className="font-black text-lg">{new Date(viewingFullInward.inwardDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Challan Number</p>
                                    <p className="font-black text-lg text-primary">#{viewingFullInward.challanNo || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Detailed Items Table grouped by Color */}
                            <div className="space-y-6">
                                {Object.entries(
                                    viewingFullInward.items.reduce((acc: any, item: any) => {
                                        const color = item.color || 'Unspecified';
                                        if (!acc[color]) acc[color] = [];
                                        acc[color].push(item);
                                        return acc;
                                    }, {})
                                ).map(([colorName, items]: [string, any], groupIdx: number) => (
                                    <div key={colorName} className="space-y-3">
                                        <div className="flex items-center gap-3 border-l-4 border-black pl-4">
                                            <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: colorName.toLowerCase() }} />
                                            <p className="text-xs font-black uppercase tracking-[0.2em]">{colorName} VARIETIES</p>
                                        </div>
                                        <div className="border border-black/10 rounded-lg overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest border-b border-black/10">
                                                        <th className="px-6 py-3 w-16">S.No</th>
                                                        <th className="px-6 py-3">Fabric Variety</th>
                                                        <th className="px-6 py-3">Color</th>
                                                        <th className="px-6 py-3 text-center">Dia Size</th>
                                                        <th className="px-6 py-3 text-center">Rolls (Pcs)</th>
                                                        <th className="px-6 py-3 text-center">QC Status</th>
                                                        <th className="px-6 py-3 text-right">Net Weight</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {items.map((item: any, idx: number) => (
                                                        <tr key={idx} className="text-sm">
                                                            <td className="px-6 py-4 text-gray-300 font-bold">{idx + 1}</td>
                                                            <td className="px-6 py-4 font-black text-black">{item.materialId?.name || 'Standard Fabric'}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color.toLowerCase() }} />
                                                                    <span className="text-[10px] font-bold uppercase">{item.color}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-black text-gray-600">{item.diameter}"</td>
                                                            <td className="px-6 py-4 text-center font-bold">{item.pcs || 0} PCS</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                        item.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                            'bg-amber-100 text-amber-700'
                                                                        }`}>
                                                                        {item.status}
                                                                    </span>
                                                                    {item.status === 'Rejected' && item.rejectionCause && (
                                                                        <span className="text-[7px] font-bold text-red-600 uppercase tracking-tighter leading-none">
                                                                            Cause: {item.rejectionCause}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-primary whitespace-nowrap">{item.quantity} KG</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50/50">
                                                    <tr className="font-black text-[10px] uppercase">
                                                        <td colSpan={4} className="px-6 py-3 text-right text-gray-400">Subtotal {colorName}</td>
                                                        <td className="px-6 py-3 text-center text-black">{items.reduce((s: number, i: any) => s + (Number(i.pcs) || 0), 0)} PCS</td>
                                                        <td className="px-6 py-3"></td>
                                                        <td className="px-6 py-3 text-right text-primary">{items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0).toFixed(2)} KG</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-8 border-t-2 border-black pt-6 flex justify-between items-center bg-gray-50 p-6 rounded-xl">
                                    <div className="text-xl font-black uppercase tracking-tighter">Grand Total Consignment</div>
                                    <div className="flex gap-12">
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-gray-400 uppercase">Total Rolls</div>
                                            <div className="text-2xl font-black">{viewingFullInward.items.reduce((acc: number, cur: any) => acc + (Number(cur.pcs) || 0), 0)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-gray-400 uppercase">Total Net Weight</div>
                                            <div className="text-2xl font-black text-primary">{viewingFullInward.items.reduce((acc: number, cur: any) => acc + (Number(cur.quantity) || 0), 0).toFixed(2)} KG</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dia-wise Weight Summary for Full Report */}
                            {(() => {
                                const materialSummaries = viewingFullInward.items.reduce((acc: any, item: any) => {
                                    const matName = (item.materialId?.name || 'Standard Fabric').toUpperCase();
                                    if (!acc[matName]) acc[matName] = {};
                                    const dia = item.diameter;
                                    if (!acc[matName][dia]) acc[matName][dia] = { pcs: 0, kg: 0 };
                                    acc[matName][dia].pcs += Number(item.pcs || 0);
                                    acc[matName][dia].kg += Number(item.quantity || 0);
                                    return acc;
                                }, {});

                                return (
                                    <div className="space-y-12 py-10 border-t-2 border-dashed border-gray-200 mt-10">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-600 whitespace-nowrap">PRODUCTION SUMMARY BREAKDOWN</h4>
                                            <div className="h-0.5 bg-orange-100 flex-1 rounded-full" />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {Object.entries(materialSummaries).map(([mat, dias]: [string, any]) => (
                                                <div key={mat} className="space-y-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                                                        <h5 className="text-sm font-black uppercase tracking-widest text-gray-800">{mat} SUMMARY</h5>
                                                    </div>
                                                    <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                                        <table className="w-full text-left">
                                                            <thead>
                                                                <tr className="bg-orange-50/50 border-b border-orange-100 text-[10px] font-black uppercase tracking-widest text-orange-400">
                                                                    <th className="px-6 py-4">DIA</th>
                                                                    <th className="px-6 py-4 text-center">ROLLS</th>
                                                                    <th className="px-6 py-4 text-right">WEIGHT (KG)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-orange-50">
                                                                {Object.entries(dias).sort((a: any, b: any) => Number(a[0]) - Number(b[0])).map(([dia, data]: [string, any]) => (
                                                                    <tr key={dia} className="text-sm font-bold text-gray-600">
                                                                        <td className="px-6 py-4">{dia}"</td>
                                                                        <td className="px-6 py-4 text-center font-black text-gray-900">{data.pcs}</td>
                                                                        <td className="px-6 py-4 text-right text-orange-600 font-black">{data.kg.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="bg-orange-50/20 border-t border-orange-100 font-black">
                                                                <tr className="text-sm uppercase text-black">
                                                                    <td className="px-6 py-4">TOTAL</td>
                                                                    <td className="px-6 py-4 text-center">{Object.values(dias).reduce((s: number, i: any) => s + i.pcs, 0)}</td>
                                                                    <td className="px-6 py-4 text-right text-orange-600">{Object.values(dias).reduce((s: number, i: any) => s + i.kg, 0).toFixed(2)}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Signatures */}
                            <div className="pt-20 grid grid-cols-2 gap-24">
                                <div className="border-t border-black pt-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-center">QC Inspector Signature</p>
                                </div>
                                <div className="border-t border-black pt-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-center">Unit Manager Approval</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isReweightModalOpen && reweightItem && (
                <ReweightModal
                    isOpen={isReweightModalOpen}
                    onClose={() => {
                        setIsReweightModalOpen(false);
                        setReweightItem(null);
                    }}
                    item={reweightItem}
                    onUpdate={handleReweightUpdate}
                />
            )}
            {/* Reweight History Modal */}
            {viewingReweightHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setViewingReweightHistory(null)} />
                    <div className="relative bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in duration-300 flex flex-col">
                        <div className="p-6 border-b border-border bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 rounded-xl">
                                    <ClipboardList className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">LOT #{viewingReweightHistory.lotNo} HISTORY</h3>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">COMPREHENSIVE CORRECTION AUDIT LOG</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-6 py-2.5 bg-[#f28b43] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200 flex items-center gap-2 hover:opacity-90 transition-all">
                                    <Download className="w-4 h-4" />
                                    DOWNLOAD FULL HISTORY PDF
                                </button>
                                <button onClick={() => setViewingReweightHistory(null)} className="p-2.5 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar space-y-10 bg-gray-50/50">
                            {/* 1. Core Metadata Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <p className="text-xl font-black text-foreground">{viewingReweightHistory.partyId?.name || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <p className="text-xl font-black text-foreground">CH: {viewingReweightHistory.challanNo}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <p className="text-xl font-black text-foreground">{new Date(viewingReweightHistory.inwardDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* 2. Weight Change Summary Cards */}
                            {(() => {
                                let totalInc = 0;
                                let totalDec = 0;
                                viewingReweightHistory.items.forEach((item: any) => {
                                    const h = item.history?.filter((hh: any) => hh.action === 'Reweighted') || [];
                                    const orig = h.length > 0 ? Number(h[h.length - 1].oldWeight || item.quantity) : Number(item.quantity);
                                    const current = Number(item.quantity);
                                    const diff = current - orig;
                                    if (diff > 0) totalInc += diff;
                                    else if (diff < 0) totalDec += Math.abs(diff);
                                });
                                const net = totalInc - totalDec;

                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-blue-50/30 border border-blue-100 p-6 rounded-2xl flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                                <ArrowUp className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Increased</p>
                                                <p className="text-2xl font-black text-blue-700">+{totalInc.toFixed(2)} <span className="text-sm font-bold opacity-60">KG</span></p>
                                            </div>
                                        </div>
                                        <div className="bg-rose-50/30 border border-rose-100 p-6 rounded-2xl flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
                                                <ArrowDown className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Decreased</p>
                                                <p className="text-2xl font-black text-rose-600">-{totalDec.toFixed(2)} <span className="text-sm font-bold opacity-60">KG</span></p>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-2xl flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                                <ArrowUpRight className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Net Change</p>
                                                <p className="text-2xl font-black text-emerald-700">+{net.toFixed(2)} <span className="text-sm font-bold opacity-60">KG</span></p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}


                            <div className="h-px bg-gray-200 w-full" />

                            <div className="flex items-center gap-3 px-2">
                                <FileText className="w-6 h-6 text-[#f28b43]" />
                                <h4 className="text-xl font-black uppercase tracking-tight">FINAL BATCH COMPARISON</h4>
                            </div>

                            <div className="overflow-hidden border-2 border-black rounded-lg bg-white shadow-2xl">
                                {(() => {
                                    const filteredItems = viewingReweightHistory.items.filter((it: any) => it.history?.some((h: any) => h.action === 'Reweighted'));
                                    const totals = filteredItems.reduce((acc: any, item: any) => {
                                        const latestReweight = [...(item.history || [])].reverse().find((h: any) => h.action === 'Reweighted');
                                        const original = latestReweight?.oldWeight || item.quantity;
                                        const diff = Number(item.quantity) - Number(original);

                                        acc.pcs += Number(item.pcs || 0);
                                        acc.initial += Number(original);
                                        acc.adjustment += diff;
                                        acc.current += Number(item.quantity);
                                        return acc;
                                    }, { pcs: 0, initial: 0, adjustment: 0, current: 0 });

                                    return (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                                    <th className="px-6 py-5 border-r border-white/20">Description</th>
                                                    <th className="px-6 py-5 border-r border-white/20">Initial (KG)</th>
                                                    <th className="px-6 py-5 border-r border-white/20">Adjustment</th>
                                                    <th className="px-6 py-5 border-r border-white/20">Current (KG)</th>
                                                    <th className="px-6 py-5">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-black">
                                                {filteredItems.map((item: any, idx: number) => {
                                                    const latestReweight = [...(item.history || [])].reverse().find((h: any) => h.action === 'Reweighted');
                                                    const original = latestReweight?.oldWeight || item.quantity;
                                                    const diff = Number(item.quantity) - Number(original);

                                                    return (
                                                        <tr key={idx} className="group hover:bg-gray-50 transition-colors text-sm font-bold">
                                                            <td className="px-6 py-6 border-r-2 border-black">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color.toLowerCase() }} />
                                                                    <div className="text-xs font-black text-black">
                                                                        {item.color} - {item.diameter}" DIA ({item.pcs} PCS)
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-6 border-r-2 border-black font-bold text-gray-500">
                                                                {Number(original).toFixed(2)}
                                                            </td>
                                                            <td className={`px-6 py-6 border-r-2 border-black font-black ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                                                                {diff > 0 ? '+' : ''}{diff !== 0 ? diff.toFixed(2) : '-'}
                                                            </td>
                                                            <td className="px-6 py-6 border-r-2 border-black">
                                                                <div className="text-2xl font-black text-emerald-600 tracking-tighter">
                                                                    {Number(item.quantity).toFixed(2)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-6">
                                                                <div className="px-3 py-1 bg-blue-600 text-white rounded text-[8px] font-black tracking-[0.2em] uppercase w-fit shadow-md">
                                                                    CORRECTED
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-black text-white font-black border-t-4 border-black">
                                                <tr>
                                                    <td className="px-6 py-8 border-r-2 border-white/10">
                                                        <div className="flex flex-col">
                                                            <span className="text-xl uppercase tracking-tighter leading-none">GRAND TOTAL</span>
                                                            <span className="text-[9px] opacity-40 uppercase tracking-[0.2em] mt-1">{totals.pcs} PIECES VERIFIED</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8 border-r-2 border-white/10 text-lg opacity-60">
                                                        {totals.initial.toFixed(2)}
                                                    </td>
                                                    <td className={`px-6 py-8 border-r-2 border-white/10 text-lg ${totals.adjustment > 0 ? 'text-blue-400' : totals.adjustment < 0 ? 'text-rose-400' : 'text-white/20'}`}>
                                                        {totals.adjustment > 0 ? '+' : ''}{totals.adjustment.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-8 border-r-2 border-white/10">
                                                        <div className="text-3xl font-black text-emerald-400 tracking-tighter">
                                                            {totals.current.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8">
                                                        <div className="flex flex-col">
                                                            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">AUDITED</div>
                                                            <div className="text-[8px] opacity-40 uppercase whitespace-nowrap">SUCCESSFUL</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    );
                                })()}
                            </div>

                            <div className="h-px bg-gray-200 w-full" />

                            {/* 3. Dia-wise Weight Summary (New Section based on Screenshot) */}
                            {(() => {
                                const materialSummaries = viewingReweightHistory.items.reduce((acc: any, item: any) => {
                                    const matName = (item.materialId?.name || 'Standard Fabric').toUpperCase();
                                    if (!acc[matName]) acc[matName] = {};
                                    const dia = item.diameter;
                                    if (!acc[matName][dia]) acc[matName][dia] = { pcs: 0, kg: 0 };
                                    acc[matName][dia].pcs += Number(item.pcs || 0);
                                    acc[matName][dia].kg += Number(item.quantity || 0);
                                    return acc;
                                }, {});

                                return (
                                    <div className="space-y-12 py-6">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-600 whitespace-nowrap">FABRIC PRODUCTION SUMMARY (DIA | PCS | KG)</h4>
                                            <div className="h-0.5 bg-orange-100 flex-1 rounded-full" />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {Object.entries(materialSummaries).map(([mat, dias]: [string, any]) => (
                                                <div key={mat} className="space-y-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                                                        <h5 className="text-sm font-black uppercase tracking-widest text-gray-800">{mat} SUMMARY</h5>
                                                    </div>
                                                    <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white shadow-xl shadow-orange-900/5">
                                                        <table className="w-full text-left">
                                                            <thead>
                                                                <tr className="bg-orange-50/50 border-b border-orange-100 text-[10px] font-black uppercase tracking-widest text-orange-400">
                                                                    <th className="px-6 py-4">DIA</th>
                                                                    <th className="px-6 py-4 text-center">PCS</th>
                                                                    <th className="px-6 py-4 text-right">KG</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-orange-50">
                                                                {Object.entries(dias).sort((a: any, b: any) => Number(a[0]) - Number(b[0])).map(([dia, data]: [string, any]) => (
                                                                    <tr key={dia} className="text-sm font-bold text-gray-600 group hover:bg-orange-50/30 transition-colors">
                                                                        <td className="px-6 py-4">{dia}"</td>
                                                                        <td className="px-6 py-4 text-center font-black text-gray-900">{data.pcs}</td>
                                                                        <td className="px-6 py-4 text-right text-orange-600 font-black">{data.kg.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="bg-orange-50/20 border-t border-orange-100 italic">
                                                                <tr className="text-sm font-black uppercase text-black">
                                                                    <td className="px-6 py-4">TOTAL</td>
                                                                    <td className="px-6 py-4 text-center">{Object.values(dias).reduce((s: number, i: any) => s + i.pcs, 0)}</td>
                                                                    <td className="px-6 py-4 text-right text-orange-600">{Object.values(dias).reduce((s: number, i: any) => s + i.kg, 0).toFixed(2)}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                );
                            })()}

                            {/* Full Batch Banner */}
                            {viewingReweightHistory.items.filter((it: any) => it.history?.some((h: any) => h.action === 'Reweighted')).length === viewingReweightHistory.items.length && (
                                <div className="p-10 bg-black rounded-[3rem] border-8 border-white shadow-2xl flex items-center justify-between text-white overflow-hidden relative group/banner">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/banner:scale-110 transition-transform duration-700">
                                        <CheckCircle2 className="w-60 h-60" />
                                    </div>
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="p-6 bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/20">
                                            <Scale className="w-12 h-12 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black uppercase tracking-tighter">Full Consignment Audit</p>
                                            <p className="text-sm font-bold opacity-60 uppercase tracking-[0.3em] mt-2">100% Items Verified & Weight-Reconciled</p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-[0.2em] relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.3)] border border-emerald-400/50">
                                        CERTIFIED
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="p-8 bg-white border-t border-border flex justify-end shrink-0">
                            <button
                                onClick={() => setViewingReweightHistory(null)}
                                className="px-8 py-3 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95"
                            >
                                Close Audit Log
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
