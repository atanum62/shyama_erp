'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Ruler, Search, Loader2, Package, ArrowRight, CheckCircle2,
    X, Save, Plus, ChevronDown, ChevronUp, History, Info,
    Calculator, Truck, AlertTriangle, Layers, Trash2, Eye,
    Box, Activity, LayoutGrid, CheckCircle, RotateCcw,
    ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

export default function CuttingSizePage() {
    const [approvedInwards, setApprovedInwards] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [consumptions, setConsumptions] = useState<any[]>([]);
    const [masterProducts, setMasterProducts] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({});
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isReverting, setIsReverting] = useState<string | null>(null);

    // Draft state for inline row selection
    const [draftSelections, setDraftSelections] = useState<Record<string, { productName: string; size: string }>>({});
    const [diameterMappings, setDiameterMappings] = useState<any[]>([]);
    const [isBulkSaving, setIsBulkSaving] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);


    const fetchData = async () => {
        setLoading(true);
        try {
            const resInward = await fetch('/api/inward');
            const resAssignments = await fetch('/api/cutting/lot-assignments');
            const resConsumption = await fetch('/api/consumption');
            const resMappings = await fetch('/api/diameter-mapping');
            const resProducts = await fetch('/api/masters/products');

            if (resInward.ok) {
                const dataInward = await resInward.json();
                if (Array.isArray(dataInward)) {
                    const flattened = dataInward.flatMap(inward =>
                        inward.items
                            .filter((item: any) =>
                                item.status === 'Approved' &&
                                (item.materialId?.subType?.toLowerCase() === 'interlock' || !item.materialId?.subType)
                            )
                            .map((item: any) => ({
                                ...item,
                                inwardId: inward._id,
                                challanNo: inward.challanNo,
                                partyName: inward.partyId?.name,
                                globalLotNo: inward.lotNo,
                                inwardDate: inward.inwardDate
                            }))
                    );
                    setApprovedInwards(flattened);
                }
            }

            if (resAssignments.ok) setAssignments(await resAssignments.json());
            if (resConsumption.ok) setConsumptions(await resConsumption.json());
            if (resMappings.ok) setDiameterMappings(await resMappings.json());
            if (resProducts.ok) setMasterProducts(await resProducts.json());

        } catch (err: any) {
            console.error('Detailed fetch error:', err);
            if (err.message === 'Failed to fetch') {
                console.warn('Network error detected. Retrying once in 2 seconds...');
                setTimeout(fetchData, 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const lotGroups = useMemo(() => {
        const groups: Record<string, any> = {};

        approvedInwards.forEach(item => {
            const lotKey = item.lotNo || item.globalLotNo || 'NO-LOT';
            if (!groups[lotKey]) {
                groups[lotKey] = {
                    lotNo: lotKey,
                    totalWeight: 0,
                    totalPcs: 0,
                    items: [],
                    assignments: assignments.filter(a => a.lotNo === lotKey),
                    partyName: item.partyName,
                    materialName: item.materialId?.name || 'Fabric',
                    color: item.color,
                    inwardDate: item.inwardDate,
                    challanNo: item.challanNo,
                    uniqueColors: new Set(),
                    uniqueDiameters: new Set()
                };
            }
            groups[lotKey].totalWeight += Number(item.quantity) || 0;
            groups[lotKey].totalPcs += Number(item.pcs) || 0;
            groups[lotKey].items.push(item);
            groups[lotKey].uniqueColors.add(item.color);
            groups[lotKey].uniqueDiameters.add(item.diameter);
        });

        Object.keys(groups).forEach(key => {
            const usedTotal = groups[key].assignments.reduce((sum: number, a: any) => sum + (Number(a.usedWeight) || 0), 0);
            groups[key].remainingWeight = groups[key].totalWeight - usedTotal;
            groups[key].color = Array.from(groups[key].uniqueColors).join(', ');
            groups[key].diameter = Array.from(groups[key].uniqueDiameters).join(', ');
        });

        return Object.values(groups);
    }, [approvedInwards, assignments]);

    const filteredLots = useMemo(() => {
        return lotGroups.filter(lot =>
            lot.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [lotGroups, searchTerm]);

    const paginatedLots = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredLots.slice(start, start + rowsPerPage);
    }, [filteredLots, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredLots.length / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    const dashboardStats = useMemo(() => {
        const totalLots = lotGroups.length;
        const pendingLots = lotGroups.filter(l => l.remainingWeight > 0.1 && l.assignments.length === 0).length;
        const partiallyLots = lotGroups.filter(l => l.remainingWeight > 0.1 && l.assignments.length > 0).length;
        const fullyLots = lotGroups.filter(l => l.remainingWeight <= 0.1).length;
        const totalAvailableWeight = lotGroups.reduce((acc, l) => acc + l.totalWeight, 0);

        return {
            totalLots,
            pendingLots,
            partiallyLots,
            fullyLots,
            totalAvailableWeight: totalAvailableWeight.toFixed(1)
        };
    }, [lotGroups]);

    const toggleLotExpansion = (lotNo: string) => {
        setExpandedLots(prev => ({ ...prev, [lotNo]: !prev[lotNo] }));
    };

    const buildAssignmentPayload = (item: any, draft: { productName: string; size: string }) => {
        const consumption = consumptions.find(c =>
            c.productName.trim().toLowerCase() === draft.productName.trim().toLowerCase()
        );
        if (!consumption) {
            throw new Error(`No consumption data found for "${draft.productName}". Please define it in Masters → Consumption first.`);
        }
        const variation = consumption.variations.find((v: any) =>
            v.size.toString().trim().toLowerCase() === draft.size.toString().trim().toLowerCase()
        );
        if (!variation) {
            throw new Error(`Size "${draft.size}" not found in consumption master for "${draft.productName}". Available sizes: ${consumption.variations.map((v: any) => v.size).join(', ')}`);
        }
        const comps = variation.consumption;
        const findVal = (keywords: string[]) => {
            for (const kw of keywords) {
                const c = comps.find((c: any) => c.name.trim().toLowerCase().includes(kw.toLowerCase()));
                if (c) return Number(c.value) || 0;
            }
            return 0;
        };
        const interlockWeight = findVal(['interlock']);
        const wastageWeight = findVal(['wastage', 'waste']);
        const ribConsumption = findVal(['rib']);
        let bodyWeight = findVal(['body weight', 'body']);
        if (bodyWeight === 0) {
            bodyWeight = comps
                .filter((c: any) => !['interlock', 'wastage', 'waste', 'rib'].some(kw => c.name.toLowerCase().includes(kw)))
                .reduce((sum: number, c: any) => sum + (Number(c.value) || 0), 0);
        }
        const divisor = bodyWeight + wastageWeight + interlockWeight;
        if (divisor <= 0) throw new Error('Consumption values sum to zero — please check Master Data entries for this product & size.');
        const dozen = Number(item.quantity) / divisor;
        const pieces = Math.round(dozen * 12);
        const matId = item.materialId?._id || item.materialId;

        return {
            lotNo: item.lotNo || item.globalLotNo,
            inwardId: item.inwardId,
            itemId: item._id,
            productName: draft.productName.trim(),
            productSize: draft.size.trim(),
            diameter: item.diameter,
            usedWeight: Number(item.quantity),
            totalDozen: Number(dozen.toFixed(2)),
            totalPieces: pieces,
            color: item.color,
            materialId: matId,
            consumptionPerDozen: bodyWeight,
            wastageWeight,
            interlockWeight,
            ribConsumption,
            remarks: 'Assigned via Direct Master Link'
        };
    };

    const handleUpdateAssignment = async (item: any, draft: { productName: string; size: string }) => {
        if (!draft.productName || !draft.size) return;
        setIsUpdating(item._id);
        try {
            const payload = buildAssignmentPayload(item, draft);
            const res = await fetch('/api/cutting/lot-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await fetchData();
                setDraftSelections(prev => { const next = { ...prev }; delete next[item._id]; return next; });
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save assignment');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteAssignment = async (id: string) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;
        try {
            const res = await fetch(`/api/cutting/lot-assignments?id=${id}`, { method: 'DELETE' });
            if (res.ok) await fetchData();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleRevertLot = async (lotNo: string, assignmentCount: number) => {
        if (!confirm(`This will permanently remove all ${assignmentCount} assignment(s) for Lot ${lotNo}.\n\nAre you sure?`)) return;
        setIsReverting(lotNo);
        try {
            const res = await fetch(`/api/cutting/lot-assignments?lotNo=${encodeURIComponent(lotNo)}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to revert lot');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsReverting(null);
        }
    };

    const handleLotProductSelect = (lotNo: string, productName: string) => {
        const lot = lotGroups.find(l => l.lotNo === lotNo);
        if (!lot) return;

        const productMapping = diameterMappings.find(m =>
            m.productName.trim().toLowerCase() === productName.trim().toLowerCase()
        );

        if (!productMapping) {
            alert(`No Diameter → Size mappings found for "${productName}". Please define them in Masters → Diameter Mapping.`);
        }

        const newDrafts = { ...draftSelections };
        let unmappedDiameters: string[] = [];

        lot.items.forEach((item: any) => {
            const asgn = lot.assignments.find((a: any) => a.itemId === item._id);
            if (!asgn) {
                const foundMapping = productMapping?.mappings.find((m: any) =>
                    Number(m.diameter) === Number(item.diameter)
                );

                const mappedSize = String(foundMapping?.size || '').trim();

                if (productName && !mappedSize) {
                    unmappedDiameters.push(item.diameter);
                }

                newDrafts[item._id] = { productName, size: mappedSize };
            }
        });

        if (unmappedDiameters.length > 0) {
            const uniqueUnmapped = Array.from(new Set(unmappedDiameters));
            alert(`Some items in this lot (Diameters: ${uniqueUnmapped.join(', ')}) do not have a mapped size for "${productName}".\n\nYou must select their sizes manually before saving.`);
        }

        setDraftSelections(newDrafts);
    };

    const handleBulkSave = async (lotNo: string) => {
        const lot = lotGroups.find(l => l.lotNo === lotNo);
        if (!lot) return;

        const itemsToSave = lot.items.filter((item: any) => {
            const asgn = lot.assignments.find((a: any) => a.itemId === item._id);
            const draft = draftSelections[item._id];
            return !asgn && draft?.productName && draft?.size;
        });

        if (itemsToSave.length === 0) return;

        setIsBulkSaving(lotNo);
        try {
            for (const item of itemsToSave) {
                const draft = draftSelections[item._id];
                if (!draft.size || !draft.size.trim()) {
                    throw new Error(`Size missing for item with diameter ${item.diameter}. Bulk save stopped.`);
                }
            }

            const payloads = itemsToSave.map((item: any) =>
                buildAssignmentPayload(item, draftSelections[item._id])
            );

            const results = await Promise.all(
                payloads.map((payload: any) =>
                    fetch('/api/cutting/lot-assignments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                )
            );

            const failed = results.filter(r => !r.ok);
            if (failed.length > 0) {
                const errBody = await failed[0].json();
                alert(`${failed.length} assignment(s) failed: ${errBody.error || 'Unknown error'}`);
            }

            await fetchData();
            setDraftSelections(prev => {
                const next = { ...prev };
                itemsToSave.forEach((item: any) => delete next[item._id]);
                return next;
            });

        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsBulkSaving(null);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" />
                        Fabric Lot Assignment
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Link fabric lots directly to product master data for production calculation</p>
                </div>
            </div>

            {/* Overview Analytics Grid */}
            {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.totalAvailableWeight} <span className="text-[10px] text-muted font-bold">KG</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Total Available Fabric</p>
                    </div>

                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.pendingLots} <span className="text-[10px] text-muted font-bold">Lots</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Pending Assignment</p>
                    </div>

                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <Layers className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.partiallyLots} <span className="text-[10px] text-muted font-bold">Lots</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Partially Assigned</p>
                    </div>

                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.fullyLots} <span className="text-[10px] text-muted font-bold">Lots</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Fully Assigned</p>
                    </div>
                </div>
            )}

            {/* Controls Bar: Search, Rows, Pagination */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search by lot, color, party..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-secondary/20 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Rows:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-card border border-border rounded-lg text-xs font-black p-1 focus:outline-none"
                        >
                            {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest mr-2 leading-none whitespace-nowrap">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                    <button onClick={fetchData} className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border text-muted" title="Refresh Data">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Lot Summary Cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        <span className="text-sm font-medium text-slate-500 italic tracking-widest">Fetching Lot Portfolio...</span>
                    </div>
                ) : filteredLots.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300">
                        <Package className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium tracking-tight">No lots ready for assignment</p>
                    </div>
                ) : (
                    <>
                        {paginatedLots.map((lot) => (
                            <div key={lot.lotNo} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:border-primary/20">
                                {/* Lot Summary Bar */}
                                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <button
                                            onClick={() => toggleLotExpansion(lot.lotNo)}
                                            className={`p-2 rounded-xl transition-all ${expandedLots[lot.lotNo] ? 'bg-primary text-white' : 'bg-secondary/50 text-muted hover:bg-secondary'}`}
                                        >
                                            <ChevronRight className={`w-5 h-5 transition-transform ${expandedLots[lot.lotNo] ? 'rotate-90' : ''}`} />
                                        </button>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-foreground">LOT: {lot.lotNo}</span>
                                                {lot.remainingWeight < 0.1 && (
                                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-500/20">Fully Assigned</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-tight truncate max-w-[150px]">{lot.partyName}</span>
                                                <div className="w-1 h-1 rounded-full bg-border" />
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-tight">{lot.color}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {lot.remainingWeight > 0.1 && (
                                            <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-xl border border-border/50">
                                                <select
                                                    onChange={(e) => handleLotProductSelect(lot.lotNo, e.target.value)}
                                                    className="bg-transparent h-8 px-2 text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer"
                                                >
                                                    <option value="">Map All To...</option>
                                                    {masterProducts.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                                                </select>
                                                <button
                                                    onClick={() => handleBulkSave(lot.lotNo)}
                                                    disabled={isBulkSaving === lot.lotNo || !lot.items.some((item: any) => !lot.assignments.find((a: any) => a.itemId === item._id) && draftSelections[item._id]?.size)}
                                                    className="h-8 px-3 bg-primary text-white text-[9px] font-black rounded-lg hover:bg-primary/90 flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-30"
                                                >
                                                    {isBulkSaving === lot.lotNo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                    Bulk Save
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 border-l border-border pl-6">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest leading-none">Total</span>
                                                <span className="text-sm font-black text-foreground mt-1">{lot.totalWeight.toFixed(1)} <span className="text-[8px] text-muted">KG</span></span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest leading-none">Remaining</span>
                                                <span className={`text-sm font-black mt-1 ${lot.remainingWeight > 0.1 ? 'text-primary' : 'text-muted'}`}>{lot.remainingWeight.toFixed(1)} <span className="text-[8px] opacity-50">KG</span></span>
                                            </div>
                                        </div>

                                        {lot.assignments.length > 0 && (
                                            <button
                                                onClick={() => handleRevertLot(lot.lotNo, lot.assignments.length)}
                                                disabled={isReverting === lot.lotNo}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                title={`Revert ${lot.assignments.length} assignments`}
                                            >
                                                <RotateCcw className={`w-4 h-4 ${isReverting === lot.lotNo ? 'animate-spin' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Stock Assignment Table */}
                                {expandedLots[lot.lotNo] && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <div className="overflow-hidden border-b border-slate-100">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-3">Inward Stock Part</th>
                                                        <th className="px-6 py-3 text-center">Specifications</th>
                                                        <th className="px-6 py-3 text-center">Net Weight</th>
                                                        <th className="px-6 py-3">Assign Produce (Master Data)</th>
                                                        <th className="px-6 py-3 text-center">Est. Production</th>
                                                        <th className="px-6 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {lot.items.map((item: any, i: number) => {
                                                        const asgn = lot.assignments.find((a: any) => a.itemId === item._id);
                                                        const draft = draftSelections[item._id] || { productName: asgn?.productName || '', size: asgn?.productSize || '' };

                                                        return (
                                                            <tr key={item._id || i} className={`hover:bg-slate-50/30 transition-colors ${asgn ? 'bg-green-50/20' : ''}`}>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                                                        <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: item.color?.toLowerCase() }}></div>
                                                                        {item.color}
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase italic">{item.challanNo}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="text-xs font-bold text-slate-600 block">{item.diameter} CM</span>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase">{item.pcs} PCS</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="text-sm font-black text-primary">{item.quantity} KG</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {asgn ? (
                                                                        asgn.productSize ? (
                                                                            <div className="space-y-1">
                                                                                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                                                    <Box className="w-3.5 h-3.5 text-primary/40" />
                                                                                    {asgn.productName}
                                                                                </div>
                                                                                <div className="inline-flex items-center px-2 py-0.5 rounded shadow-sm bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-tight">
                                                                                    Size: {asgn.productSize}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            (() => {
                                                                                const mapping = diameterMappings.find(m =>
                                                                                    m.productName.trim().toLowerCase() === asgn.productName.trim().toLowerCase()
                                                                                );
                                                                                const suggestedSize = String(mapping?.mappings.find((sm: any) =>
                                                                                    Number(sm.diameter) === Number(item.diameter)
                                                                                )?.size || '').trim();

                                                                                return (
                                                                                    <div className="space-y-2">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className="text-xs font-bold text-slate-700">{asgn.productName}</span>
                                                                                        </div>

                                                                                        {suggestedSize ? (
                                                                                            <button
                                                                                                onClick={async () => {
                                                                                                    setIsUpdating(item._id);
                                                                                                    const delRes = await fetch(`/api/cutting/lot-assignments?id=${asgn._id}`, { method: 'DELETE' });
                                                                                                    if (!delRes.ok) { alert('Failed to clear old data'); setIsUpdating(null); return; }
                                                                                                    await handleUpdateAssignment(item, { productName: asgn.productName, size: suggestedSize });
                                                                                                }}
                                                                                                disabled={isUpdating === item._id}
                                                                                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-all text-[10px] font-black uppercase group"
                                                                                            >
                                                                                                {isUpdating === item._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                                                                                                SIZE: {suggestedSize} CM
                                                                                            </button>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <select
                                                                                                    value={draftSelections[item._id]?.size || ''}
                                                                                                    onChange={(e) => setDraftSelections(prev => ({
                                                                                                        ...prev,
                                                                                                        [item._id]: { productName: asgn.productName, size: e.target.value }
                                                                                                    }))}
                                                                                                    className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 w-32"
                                                                                                >
                                                                                                    <option value="">Pick size…</option>
                                                                                                    {(consumptions.find(c =>
                                                                                                        c.productName.trim().toLowerCase() === asgn.productName.trim().toLowerCase()
                                                                                                    )?.variations || []).map((v: any) => (
                                                                                                        <option key={v.size} value={v.size}>{v.size}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                <button
                                                                                                    onClick={async () => {
                                                                                                        const picked = draftSelections[item._id]?.size;
                                                                                                        if (!picked) return;
                                                                                                        setIsUpdating(item._id);
                                                                                                        await fetch(`/api/cutting/lot-assignments?id=${asgn._id}`, { method: 'DELETE' });
                                                                                                        await handleUpdateAssignment(item, { productName: asgn.productName, size: picked });
                                                                                                    }}
                                                                                                    className="p-1.5 bg-amber-500 text-white rounded-lg"
                                                                                                >
                                                                                                    <Save className="w-4 h-4" />
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()
                                                                        )
                                                                    ) : (
                                                                        <div className="flex flex-col gap-2">
                                                                            <select
                                                                                value={draft.productName}
                                                                                onChange={(e) => {
                                                                                    const pName = e.target.value;
                                                                                    const mapping = diameterMappings.find(m =>
                                                                                        m.productName.trim().toLowerCase() === pName.trim().toLowerCase()
                                                                                    );
                                                                                    const autoSize = String(mapping?.mappings.find((sm: any) =>
                                                                                        Number(sm.diameter) === Number(item.diameter)
                                                                                    )?.size || '').trim();

                                                                                    setDraftSelections(prev => ({
                                                                                        ...prev,
                                                                                        [item._id]: { productName: pName, size: autoSize }
                                                                                    }));
                                                                                }}
                                                                                className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all hover:border-primary/30"
                                                                            >
                                                                                <option value="">Select Product...</option>
                                                                                {masterProducts.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                                                                            </select>

                                                                            {draft.productName && (
                                                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                                                    {draft.size ? (
                                                                                        <div
                                                                                            onClick={() => setDraftSelections(prev => ({ ...prev, [item._id]: { ...draft, size: '' } }))}
                                                                                            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black rounded-lg cursor-pointer hover:bg-indigo-100 transition-all flex items-center gap-2 group"
                                                                                            title="Click to manually change size"
                                                                                        >
                                                                                            <LayoutGrid className="w-3 h-3 text-indigo-400" />
                                                                                            SIZE: {draft.size}
                                                                                            <Plus className="w-3 h-3 rotate-45 text-indigo-300 group-hover:text-indigo-500" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <select
                                                                                            value={draft.size}
                                                                                            onChange={(e) => setDraftSelections(prev => ({ ...prev, [item._id]: { ...draft, size: e.target.value } }))}
                                                                                            className="h-9 px-3 bg-white border-2 border-amber-300 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-amber-400/20 w-32 shadow-sm text-amber-700 animate-pulse"
                                                                                        >
                                                                                            <option value="">Pick Size...</option>
                                                                                            {(consumptions.find(c =>
                                                                                                c.productName.trim().toLowerCase() === draft.productName.trim().toLowerCase()
                                                                                            )?.variations || []).map((v: any) => (
                                                                                                <option key={v.size} value={v.size}>{v.size}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    {asgn ? (
                                                                        <div className="text-sm font-black text-green-600 leading-none">{asgn.totalDozen} <span className="text-[8px] uppercase">Doz</span></div>
                                                                    ) : (
                                                                        <span className="text-slate-300 italic text-[10px]">Pending Assignment</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {asgn ? (
                                                                        <button
                                                                            onClick={() => handleDeleteAssignment(asgn._id)}
                                                                            className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                                                            title="Remove Assignment"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleUpdateAssignment(item, draft)}
                                                                            disabled={isUpdating === item._id || !draft.productName || !draft.size}
                                                                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-30 flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-indigo-600/10"
                                                                        >
                                                                            {isUpdating === item._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                                            Assign
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="p-4 bg-slate-50/50 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-4">
                                                <span className="uppercase tracking-widest">Master Record Synchronization Active</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                                <span className="italic">Calculations based on Body + Wastage + Interlock coefficients</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-border bg-secondary/10 flex items-center justify-between mt-4 rounded-2xl border bg-white">
                                <div className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredLots.length)} of {filteredLots.length} lots
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-1">
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
                                                        className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card border border-border text-muted hover:bg-secondary active:scale-95'}`}
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
                                        className="p-1.5 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
