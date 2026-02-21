'use client';

import React, { useState, useEffect } from 'react';
import {
    Scale,
    Search,
    AlertCircle,
    X,
    ArrowRight,
    CheckCircle2,
    Calculator,
    Maximize2,
    CheckCircle,
    History,
    Archive,
    RotateCcw,
    Filter,
    CloudUpload,
    Loader2,
    Eye,
    Edit3
} from 'lucide-react';
import { ReweightModal } from '@/components/fabric/ReweightModal';
import { BulkReweightModal } from '@/components/fabric/BulkReweightModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, FileText, LayoutList, ClipboardList } from 'lucide-react';

export default function FabricReweightPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Reweight Modal State
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Bulk Reweight Modal State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkItems, setBulkItems] = useState<any[]>([]);
    const [bulkModalPersistentState, setBulkModalPersistentState] = useState<any>(null);

    // Large View State
    const [viewingSpecificColor, setViewingSpecificColor] = useState<{
        inwardId: string;
        lotNo: string;
        color: string;
        items: any[];
    } | null>(null);

    // Selection State
    const [selectedColors, setSelectedColors] = useState<Record<string, string[]>>({});

    // Session Pending (Before DB Push)
    const [sessionUpdates, setSessionUpdates] = useState<Record<string, any[]>>({});
    const [isPushing, setIsPushing] = useState(false);

    // Tabs State
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // Lot History State
    const [viewingLotHistory, setViewingLotHistory] = useState<any | null>(null);
    const [isDownloadingHistory, setIsDownloadingHistory] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inward');
            const data = await res.json();
            setInwards(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    // Filter inwards that have at least one item rejected due to Weight
    const reweightInwards = inwards.filter(inward =>
        inward.items.some((item: any) =>
            item.status === 'Rejected' && item.rejectionCause === 'Weight'
        )
    );

    // Filter inwards that have reweight history
    const historyInwards = inwards.filter(inward =>
        inward.items.some((item: any) =>
            item.history?.some((h: any) => h.action === 'Reweighted')
        )
    );

    const activeInwards = activeTab === 'pending' ? reweightInwards : historyInwards;

    const filteredInwards = activeInwards.filter(inward => {
        const query = searchTerm.toLowerCase();
        return (
            inward.lotNo?.toLowerCase().includes(query) ||
            inward.challanNo?.toLowerCase().includes(query) ||
            inward.partyId?.name?.toLowerCase().includes(query)
        );
    });

    const downloadLotHistoryPDF = async (lotData: any) => {
        const element = document.getElementById('lot-history-report');
        if (!element) return;

        setIsDownloadingHistory(true);
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Lot_History_${lotData.lotNo}_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setIsDownloadingHistory(false);
        }
    };

    const handleReweightUpdate = async (inwardId: string, itemId: string, newWeight: number) => {
        // Individual update still goes to session pending first as per user request "confirm update dont push data"
        const item = inwards.find(inw => inw._id === inwardId)?.items.find((it: any) => it._id === itemId);

        const update = {
            inwardId,
            itemId,
            newWeight,
            reweightedBy: 'System User', // Default if not using bulk modal
            color: item?.color,
            diameter: item?.diameter,
            pcs: item?.pcs,
            oldWeight: item?.quantity,
            timestamp: new Date().toISOString()
        };

        setSessionUpdates(prev => {
            const key = `${inwardId}-${item?.color}`;
            const existing = prev[key] || [];
            // Remove previous update for same item if exists
            const filtered = existing.filter(u => u.itemId !== itemId);
            return {
                ...prev,
                [key]: [...filtered, update]
            };
        });
    };

    const handleBulkReweightUpdate = async (updates: any[]) => {
        // updates already contains metadata from BulkReweightModal
        setSessionUpdates(prev => {
            const newSession = { ...prev };
            updates.forEach(up => {
                const key = `${up.inwardId}-${up.color}`;
                if (!newSession[key]) newSession[key] = [];
                // Replace if exists
                newSession[key] = newSession[key].filter(u => u.itemId !== up.itemId);
                newSession[key].push({ ...up, timestamp: new Date().toISOString() });
            });
            return newSession;
        });

        setSelectedColors({}); // Clear selections
        if (viewingSpecificColor) setViewingSpecificColor(null);
    };

    const pushToDatabase = async (key: string) => {
        const updates = sessionUpdates[key];
        if (!updates || updates.length === 0) return;

        setIsPushing(true);
        try {
            for (const up of updates) {
                await fetch(`/api/inward/${up.inwardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'Pending',
                        rejectionCause: '',
                        itemId: up.itemId,
                        quantity: up.newWeight,
                        isReweightAction: true,
                        reweightedBy: up.reweightedBy
                    })
                });
            }

            // Success - remove from session
            setSessionUpdates(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });

            fetchData();
        } catch (err) {
            console.error('Push failed:', err);
            alert('Failing to sync data with server. Please try again.');
        } finally {
            setIsPushing(false);
        }
    };

    const discardSessionValues = (key: string) => {
        if (confirm('Discard all local changes for this group?')) {
            setSessionUpdates(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });
        }
    };

    const openBulkModal = (inwardId: string, items: any[]) => {
        const mappedItems = items.map((it: any) => {
            const sessionKey = `${inwardId}-${it.color}`;
            const curUpdates = sessionUpdates[sessionKey] || [];
            const up = curUpdates.find(u => u.itemId === (it._id || it.id));
            return {
                ...it,
                inwardId,
                quantity: up ? up.newWeight : it.quantity
            };
        });
        setBulkItems(mappedItems);
        setIsBulkModalOpen(true);
    };

    const pushAll = async () => {
        const keys = Object.keys(sessionUpdates);
        if (keys.length === 0) return;

        setIsPushing(true);
        try {
            for (const key of keys) {
                const updates = sessionUpdates[key];
                for (const up of updates) {
                    await fetch(`/api/inward/${up.inwardId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: 'Pending',
                            rejectionCause: '',
                            itemId: up.itemId,
                            quantity: up.newWeight,
                            isReweightAction: true,
                            reweightedBy: up.reweightedBy
                        })
                    });
                }
            }
            setSessionUpdates({});
            fetchData();
        } catch (err) {
            console.error('Push all failed:', err);
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <div className="space-y-6">
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Scale className="w-8 h-8 text-primary" />
                        FABRIC REWEIGHTING
                    </h1>
                    <p className="text-muted text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Weight Verification Portal</p>
                </div>
                <div className="flex items-center gap-3">
                    {Object.keys(sessionUpdates).length > 0 && (
                        <button
                            onClick={pushAll}
                            disabled={isPushing}
                            className="px-6 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-200 flex items-center gap-2 hover:bg-orange-600 transition-all animate-pulse"
                        >
                            {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                            Push All ({Object.values(sessionUpdates).flat().length} Items)
                        </button>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search by Lot or Challan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs Style from Image */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'pending' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
                >
                    Weight Discrepancies ({reweightInwards.length})
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'history' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
                >
                    Correction History ({historyInwards.length})
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
            </div>

            <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-[10px] font-black text-muted uppercase tracking-[0.2em] border-b border-border">
                                <th className="px-6 py-5">Lot Ref</th>
                                <th className="px-6 py-5">Dyeing House</th>
                                <th className="px-6 py-5">Consignment Info</th>
                                <th className="px-6 py-5 text-right">{activeTab === 'pending' ? 'Batch Adjustment' : 'Recent Updates'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-20 text-center font-bold text-muted animate-pulse tracking-widest uppercase text-xs">Synchronizing Weights...</td></tr>
                            ) : filteredInwards.length === 0 ? (
                                <tr><td colSpan={4} className="p-32 text-center">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <History className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <p className="text-foreground font-black text-lg">{activeTab === 'pending' ? 'All Weights Verified' : 'No History Found'}</p>
                                    <p className="text-muted text-sm mt-1 uppercase font-bold tracking-tight">{activeTab === 'pending' ? 'No items are currently pending reweighting.' : 'Reweight history will appear here once items are corrected.'}</p>
                                </td></tr>
                            ) : filteredInwards.map((inward) => (
                                <React.Fragment key={inward._id}>
                                    <tr className="bg-secondary/5 group border-t-8 border-white first:border-0 hover:bg-secondary/10 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="text-lg font-black text-foreground tracking-tighter">#{inward.lotNo || 'N/A'}</div>
                                            <div className="text-[10px] font-bold text-muted bg-secondary px-2 py-0.5 rounded w-fit mt-1 uppercase leading-none">Source Batch</div>
                                        </td>
                                        <td className="px-6 py-6 font-black text-sm">{inward.partyId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-6 text-xs font-bold text-primary">CHALLAN: {inward.challanNo}</td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        {selectedColors[inward._id]?.length > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    const colors = selectedColors[inward._id];
                                                                    const items = inward.items.filter((it: any) =>
                                                                        colors.includes(it.color) &&
                                                                        it.status === 'Rejected' &&
                                                                        it.rejectionCause === 'Weight'
                                                                    );
                                                                    if (items.length > 0) openBulkModal(inward._id, items);
                                                                }}
                                                                className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                                                            >
                                                                <Calculator className="w-4 h-4" />
                                                                Bulk Adjust Selected ({selectedColors[inward._id].length} Colors)
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                const items = inward.items.filter((it: any) =>
                                                                    it.status === 'Rejected' && it.rejectionCause === 'Weight'
                                                                );
                                                                openBulkModal(inward._id, items);
                                                            }}
                                                            className="px-4 py-2 bg-white text-primary border-2 border-primary/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 transition-all"
                                                        >
                                                            Adjust Entire Lot
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewingLotHistory(inward)}
                                                            className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                                                        >
                                                            <ClipboardList className="w-4 h-4" />
                                                            Lot History Report
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="bg-white/40">
                                        <td colSpan={4} className="px-6 py-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {Object.entries(
                                                    inward.items
                                                        .filter((it: any) => activeTab === 'pending' ? (it.status === 'Rejected' && it.rejectionCause === 'Weight') : it.history?.some((h: any) => h.action === 'Reweighted'))
                                                        .reduce((acc: any, item: any) => {
                                                            const color = item.color || 'Unknown';
                                                            if (!acc[color]) acc[color] = { color, items: [], totalQty: 0, totalPcs: 0 };
                                                            acc[color].items.push(item);
                                                            acc[color].totalQty += Number(item.quantity) || 0;
                                                            acc[color].totalPcs += Number(item.pcs) || 0;
                                                            return acc;
                                                        }, {})
                                                ).sort().map(([colorName, group]: [string, any]) => {
                                                    const isSelected = (selectedColors[inward._id] || []).includes(colorName);
                                                    const sessionKey = `${inward._id}-${colorName}`;
                                                    const pendingSessionCount = sessionUpdates[sessionKey]?.length || 0;

                                                    return (
                                                        <div
                                                            key={colorName}
                                                            onClick={(e) => {
                                                                if (activeTab === 'pending' && (e.target as HTMLElement).closest('button')) return;
                                                                if (activeTab === 'pending') toggleColorSelection(inward._id, colorName);
                                                            }}
                                                            className={`bg-white border-2 border-l-[6px] rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group/card cursor-pointer relative ${isSelected && activeTab === 'pending' ? 'border-primary ring-4 ring-primary/10' : 'border-gray-50 hover:border-primary/20'
                                                                }`}
                                                            style={{ borderLeftColor: colorName.toLowerCase() }}
                                                        >
                                                            {isSelected && activeTab === 'pending' && (
                                                                <div className="absolute top-2 right-2 z-10">
                                                                    <div className="bg-primary text-white p-1 rounded-full shadow-lg">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="p-4 border-b border-gray-50 bg-gray-50/40 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: colorName.toLowerCase() }} />
                                                                    <div>
                                                                        <div className="text-[11px] font-black text-gray-900 uppercase leading-none">{colorName}</div>
                                                                        <div className="text-[9px] font-bold text-muted mt-1">{group.items.length} VARIETIES</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {pendingSessionCount > 0 && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => pushToDatabase(sessionKey)}
                                                                                disabled={isPushing}
                                                                                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-orange-600 transition-all shadow-md shadow-orange-100"
                                                                                title="Push to Database"
                                                                            >
                                                                                {isPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                                                                                Push ({pendingSessionCount})
                                                                            </button>
                                                                            <button
                                                                                onClick={() => discardSessionValues(sessionKey)}
                                                                                className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                                                title="Discard Local Changes"
                                                                            >
                                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    <button
                                                                        onClick={() => setViewingSpecificColor({
                                                                            inwardId: inward._id,
                                                                            lotNo: inward.lotNo,
                                                                            color: colorName,
                                                                            items: group.items
                                                                        })}
                                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                                                        title="View Analysis"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        View {activeTab === 'pending' && pendingSessionCount > 0 ? 'Proposed' : 'Report'}
                                                                    </button>

                                                                    {activeTab === 'pending' && (
                                                                        <button
                                                                            onClick={() => openBulkModal(inward._id, group.items)}
                                                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                                                            title="Edit Group"
                                                                        >
                                                                            <Edit3 className="w-3 h-3" />
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="p-4 space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                                                                {group.items.map((item: any, i: number) => {
                                                                    const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);
                                                                    return (
                                                                        <div key={i} className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all group/item ${sessionUpd ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-white border-transparent hover:border-gray-100'}`}>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{item.materialId?.name || 'Fabric'}</div>
                                                                                {sessionUpd ? (
                                                                                    <div className="text-[8px] font-black text-orange-600 bg-white border border-orange-200 px-2 py-0.5 rounded italic flex items-center gap-1">
                                                                                        <CheckCircle2 className="w-2.5 h-2.5" /> READY TO PUSH
                                                                                    </div>
                                                                                ) : activeTab === 'pending' ? (
                                                                                    <div className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded italic">REJECTED</div>
                                                                                ) : (
                                                                                    item.history?.filter((h: any) => h.action === 'Reweighted').map((h: any, idx: number) => (
                                                                                        <div key={idx} className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded italic">
                                                                                            Reweighted to {h.newWeight} KG on {new Date(h.timestamp).toLocaleDateString()}
                                                                                        </div>
                                                                                    ))
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-black text-gray-800">{item.diameter}" DIA</span>
                                                                                    <span className="text-xs font-bold text-gray-300">|</span>
                                                                                    <span className="text-xs font-black text-blue-600">{item.pcs} PCS</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    {sessionUpd ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[10px] font-bold text-muted line-through">{item.quantity}</span>
                                                                                            <ArrowRight className="w-3 h-3 text-orange-400" />
                                                                                            <span className="text-sm font-black text-orange-600">{sessionUpd.newWeight} KG</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className={`${activeTab === 'pending' ? 'text-sm font-black text-red-600 line-through opacity-40' : 'text-sm font-black text-foreground'}`}>{item.quantity} KG</span>
                                                                                    )}

                                                                                    {activeTab === 'pending' && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setSelectedItem({ ...item, inwardId: inward._id, challanNo: inward.challanNo });
                                                                                                setIsModalOpen(true);
                                                                                            }}
                                                                                            className={`p-1.5 rounded-lg shadow-md transition-all ${sessionUpd ? 'bg-orange-500 text-white' : 'bg-primary text-white shadow-primary/10 hover:scale-105 active:scale-95'}`}
                                                                                        >
                                                                                            <Scale className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="h-12">
                                        <td colSpan={4}>
                                            <div className="flex items-center gap-6 px-10">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                                                <div className="flex items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                                    <span className="text-[9px] font-black text-foreground uppercase tracking-[0.4em]">
                                                        {activeTab === 'pending' ? 'WEIGHT DISCREPANCY UNIT' : 'CORRECTION HISTORY RECORD'}
                                                    </span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                </div>
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Large View / Big View Modal */}
            {viewingSpecificColor && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setViewingSpecificColor(null)} />
                    <div className="relative bg-card w-full max-w-5xl max-h-[95vh] sm:h-[90vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in duration-300 flex flex-col">
                        <div className="p-8 border-b border-border bg-secondary/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                    <History className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">{viewingSpecificColor.color} Analysis Report</h3>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest">Targeted Correction Audit Log</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {activeTab === 'history' && (
                                    <button
                                        onClick={() => {
                                            const element = document.getElementById('item-analysis-report');
                                            if (element) {
                                                setIsDownloadingHistory(true);
                                                html2canvas(element, { scale: 2 }).then(canvas => {
                                                    const imgData = canvas.toDataURL('image/png');
                                                    const pdf = new jsPDF('p', 'mm', 'a4');
                                                    const imgProps = pdf.getImageProperties(imgData);
                                                    const pdfWidth = pdf.internal.pageSize.getWidth();
                                                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                                    pdf.save(`${viewingSpecificColor.color}_Analysis_LOT_${viewingSpecificColor.lotNo}.pdf`);
                                                    setIsDownloadingHistory(false);
                                                });
                                            }
                                        }}
                                        disabled={isDownloadingHistory}
                                        className="px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition-all"
                                    >
                                        {isDownloadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        Download Analysis PDF
                                    </button>
                                )}
                                <button onClick={() => setViewingSpecificColor(null)} className="p-3 hover:bg-card rounded-2xl border border-border transition-colors">
                                    <X className="w-6 h-6 text-muted" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-8 custom-scrollbar bg-gray-50/30" id="item-analysis-report">
                            {/* Report Header for PDF */}
                            <div className="hidden pdf-only flex items-center justify-between border-b-[3px] border-black pb-8 mb-10">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter">FABRIC ANALYSIS REPORT</h1>
                                    <p className="text-xs font-bold text-gray-500 tracking-[0.4em] uppercase mt-2">Shyama ERP • {viewingSpecificColor.color} Variety</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black uppercase text-gray-400">Audit Reference</div>
                                    <div className="text-xl font-bold">LOT-{viewingSpecificColor.lotNo}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-1">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Dyeing House</p>
                                    <p className="text-xl font-black text-foreground">{inwards.find(inw => inw._id === viewingSpecificColor.inwardId)?.partyId?.name || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-1">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Consignment</p>
                                    <p className="text-xl font-black text-foreground">CH: {inwards.find(inw => inw._id === viewingSpecificColor.inwardId)?.challanNo || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-1">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Audit Date</p>
                                    <p className="text-xl font-black text-foreground">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <h4 className="text-lg font-black uppercase tracking-tight">Variety Comparison</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse border-[2px] border-black min-w-[600px] bg-white">
                                        <thead>
                                            <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                                <th className="p-4 border-r border-white/20">Specification</th>
                                                <th className="p-4 border-r border-white/20">Initial (KG)</th>
                                                <th className="p-4 border-r border-white/20">Adjustment</th>
                                                <th className="p-4 border-r border-white/20">Final (KG)</th>
                                                <th className="p-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold uppercase">
                                            {viewingSpecificColor.items.map((item: any, i: number) => {
                                                const sessionKey = `${viewingSpecificColor.inwardId}-${viewingSpecificColor.color}`;
                                                const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);

                                                const historyItems = item.history?.filter((h: any) => h.action === 'Reweighted') || [];
                                                const originalWeight = historyItems.length > 0 ? historyItems[historyItems.length - 1].oldWeight || item.quantity : item.quantity;

                                                const currentWeight = sessionUpd ? sessionUpd.newWeight : item.quantity;
                                                const diff = currentWeight - originalWeight;
                                                const isProposed = !!sessionUpd;
                                                const isPersisted = historyItems.length > 0;
                                                const hasChanged = isProposed || isPersisted;

                                                return (
                                                    <tr key={i} className={`border-b-[2px] border-black ${!hasChanged ? 'bg-gray-50/50 opacity-60' : isProposed ? 'bg-orange-50/30' : ''}`}>
                                                        <td className="p-4 border-r border-black">{item.materialId?.name || 'Fabric'} - {item.diameter}" DIA ({item.pcs} PCS)</td>
                                                        <td className="p-4 border-r border-black">{Number(originalWeight).toFixed(2)}</td>
                                                        <td className={`p-4 border-r border-black font-black ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                            {diff > 0 ? '+' : diff < 0 ? '' : '— '}{diff !== 0 ? diff.toFixed(2) : ''}
                                                        </td>
                                                        <td className={`p-4 border-r border-black font-black text-lg ${isProposed ? 'text-orange-600' : isPersisted ? 'text-blue-600' : 'text-gray-400'}`}>
                                                            {Number(currentWeight).toFixed(2)}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-[8px] font-black tracking-widest ${isProposed ? 'bg-orange-500 text-white' : isPersisted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-muted'}`}>
                                                                {isProposed ? 'PROPOSED' : isPersisted ? 'ADJUSTED' : 'STABLE'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedItem && (
                <ReweightModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedItem(null);
                    }}
                    item={selectedItem}
                    onUpdate={handleReweightUpdate}
                />
            )}

            {isBulkModalOpen && (
                <BulkReweightModal
                    isOpen={isBulkModalOpen}
                    onClose={() => {
                        setIsBulkModalOpen(false);
                        setBulkItems([]);
                        // We don't clear bulkModalPersistentState so it stays for next time
                    }}
                    selectedItems={bulkItems}
                    onUpdate={handleBulkReweightUpdate}
                    initialState={bulkModalPersistentState}
                    onStateChange={setBulkModalPersistentState}
                />
            )}

            {/* LOT HISTORY DETAILED MODAL */}
            {viewingLotHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setViewingLotHistory(null)} />
                    <div className="relative bg-card w-full max-w-5xl max-h-[95vh] sm:h-[90vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in duration-300 flex flex-col">
                        <div className="p-8 border-b border-border bg-secondary/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 rounded-2xl">
                                    <ClipboardList className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Lot #{viewingLotHistory.lotNo} History</h3>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest">Comperehensive Correction Audit Log</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => downloadLotHistoryPDF(viewingLotHistory)}
                                    disabled={isDownloadingHistory}
                                    className="px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition-all"
                                >
                                    {isDownloadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Download Full History PDF
                                </button>
                                <button onClick={() => setViewingLotHistory(null)} className="p-3 hover:bg-card rounded-2xl border border-border transition-colors">
                                    <X className="w-6 h-6 text-muted" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar bg-gray-50/30" id="lot-history-report">
                            {/* Report Header for PDF */}
                            <div className="hidden pdf-only flex items-center justify-between border-b-[3px] border-black pb-8 mb-10">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter">BATCH REWEIGHT HISTORY</h1>
                                    <p className="text-xs font-bold text-gray-500 tracking-[0.4em] uppercase mt-2">Shyama ERP • Quality Assurance</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black uppercase text-gray-400">Audit Reference</div>
                                    <div className="text-xl font-bold">LOT-{viewingLotHistory.lotNo}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-1">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Dyeing House</p>
                                    <p className="text-xl font-black text-foreground">{viewingLotHistory.partyId?.name || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-1">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Consignment</p>
                                    <p className="text-xl font-black text-foreground">CH: {viewingLotHistory.challanNo}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-1">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Date Received</p>
                                    <p className="text-xl font-black text-foreground">{new Date(viewingLotHistory.inwardDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* ── Weight Change Summary ── */}
                            {(() => {
                                let totalIncrease = 0;
                                let totalDecrease = 0;
                                viewingLotHistory.items.forEach((item: any) => {
                                    const sessionKey = `${viewingLotHistory._id}-${item.color}`;
                                    const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);

                                    const h = item.history?.filter((hh: any) => hh.action === 'Reweighted') || [];
                                    const orig = h.length > 0 ? Number(h[h.length - 1].oldWeight || item.quantity) : Number(item.quantity);

                                    const current = sessionUpd ? Number(sessionUpd.newWeight) : Number(item.quantity);
                                    const diff = current - orig;

                                    if (diff > 0) totalIncrease += diff;
                                    else if (diff < 0) totalDecrease += Math.abs(diff);
                                });
                                const net = totalIncrease - totalDecrease;
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-3xl flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black flex-shrink-0">↑</div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Increased</p>
                                                <p className="text-2xl font-black text-blue-700 tracking-tighter">+{totalIncrease.toFixed(2)} <span className="text-sm text-blue-400 font-bold">KG</span></p>
                                            </div>
                                        </div>
                                        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-white text-xl font-black flex-shrink-0">↓</div>
                                            <div>
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Total Decreased</p>
                                                <p className="text-2xl font-black text-red-600 tracking-tighter">-{totalDecrease.toFixed(2)} <span className="text-sm text-red-400 font-bold">KG</span></p>
                                            </div>
                                        </div>
                                        <div className={`border-2 p-5 rounded-3xl flex items-center gap-4 ${net >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 ${net >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}>{net >= 0 ? '↗' : '↘'}</div>
                                            <div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${net >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>Net Change</p>
                                                <p className={`text-2xl font-black tracking-tighter ${net >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>{net >= 0 ? '+' : ''}{net.toFixed(2)} <span className={`text-sm font-bold ${net >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>KG</span></p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}


                            {/* ── 1. Flat overview table ── */}

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <h4 className="text-lg font-black uppercase tracking-tight">Final Batch Comparison</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse border-[2px] border-black min-w-[600px] bg-white">
                                        <thead>
                                            <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                                <th className="p-4 border-r border-white/20">Description</th>
                                                <th className="p-4 border-r border-white/20">Initial (KG)</th>
                                                <th className="p-4 border-r border-white/20">Adjustment</th>
                                                <th className="p-4 border-r border-white/20">Current (KG)</th>
                                                <th className="p-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold uppercase">
                                            {viewingLotHistory.items.map((item: any, i: number) => {
                                                const sessionKey = `${viewingLotHistory._id}-${item.color}`;
                                                const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);

                                                const historyItems = item.history?.filter((h: any) => h.action === 'Reweighted') || [];
                                                const originalWeight = historyItems.length > 0 ? historyItems[historyItems.length - 1].oldWeight || item.quantity : item.quantity;

                                                const currentWeight = sessionUpd ? sessionUpd.newWeight : item.quantity;
                                                const diff = currentWeight - originalWeight;
                                                const isProposed = !!sessionUpd;
                                                const isPersisted = historyItems.length > 0;
                                                const hasChanged = isProposed || isPersisted;

                                                return (
                                                    <tr key={i} className={`border-b-[2px] border-black ${!hasChanged ? 'bg-gray-50/50 opacity-60' : isProposed ? 'bg-orange-50/40' : ''}`}>
                                                        <td className="p-4 border-r border-black">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color.toLowerCase() }} />
                                                                {item.color} - {item.diameter}" DIA ({item.pcs} PCS)
                                                            </div>
                                                        </td>
                                                        <td className="p-4 border-r border-black">{Number(originalWeight).toFixed(2)}</td>
                                                        <td className={`p-4 border-r border-black font-black ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                            {diff > 0 ? '+' : diff < 0 ? '' : '— '}{diff !== 0 ? diff.toFixed(2) : ''}
                                                        </td>
                                                        <td className={`p-4 border-r border-black font-black text-lg ${isProposed ? 'text-orange-600' : isPersisted ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                            {Number(currentWeight).toFixed(2)}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-[8px] font-black tracking-widest ${isProposed ? 'bg-orange-600 text-white' : isPersisted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-muted'}`}>
                                                                {isProposed ? 'PROPOSED' : isPersisted ? 'CORRECTED' : 'VAL-OK'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── 2. Diameter-wise breakdown ── */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <h4 className="text-lg font-black uppercase tracking-tight">Diameter-wise Breakdown</h4>
                                </div>
                                {(() => {
                                    // Group items by diameter
                                    const grouped: Record<string, any[]> = {};
                                    viewingLotHistory.items.forEach((item: any) => {
                                        const key = item.diameter;
                                        if (!grouped[key]) grouped[key] = [];
                                        grouped[key].push(item);
                                    });
                                    const diameters = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

                                    return diameters.map((dia) => {
                                        const rows = grouped[dia];
                                        const diaTotal = rows.reduce((acc: number, item: any) => {
                                            const sessionKey = `${viewingLotHistory._id}-${item.color}`;
                                            const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);
                                            return acc + (sessionUpd ? Number(sessionUpd.newWeight) : Number(item.quantity));
                                        }, 0);
                                        const diaOrigTotal = rows.reduce((acc: number, item: any) => {
                                            const h = item.history?.filter((hh: any) => hh.action === 'Reweighted') || [];
                                            const orig = h.length > 0 ? h[h.length - 1].oldWeight || item.quantity : item.quantity;
                                            return acc + Number(orig);
                                        }, 0);

                                        // per-diameter increase / decrease
                                        let diaInc = 0, diaDec = 0;
                                        rows.forEach((item: any) => {
                                            const sessionKey = `${viewingLotHistory._id}-${item.color}`;
                                            const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);

                                            const h = item.history?.filter((hh: any) => hh.action === 'Reweighted') || [];
                                            const orig = h.length > 0 ? Number(h[h.length - 1].oldWeight || item.quantity) : Number(item.quantity);

                                            const current = sessionUpd ? Number(sessionUpd.newWeight) : Number(item.quantity);
                                            const diff = current - orig;
                                            if (diff > 0) diaInc += diff;
                                            else if (diff < 0) diaDec += Math.abs(diff);
                                        });
                                        const diaNet = diaInc - diaDec;

                                        return (
                                            <div key={dia} className="overflow-hidden rounded-2xl border-[2px] border-black shadow-sm">
                                                {/* Diameter Header */}
                                                <div className="bg-black text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                                                    {/* Left: dia label */}
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl font-black tracking-tighter">{dia}"</span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">DIA</span>
                                                        <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full">{rows.length} Varieties</span>
                                                    </div>
                                                    {/* Right: stats */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="flex items-center gap-1.5 bg-blue-600/80 px-3 py-1.5 rounded-xl">
                                                            <span className="text-[10px] font-black">↑</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">INC</span>
                                                            <span className="text-sm font-black">+{diaInc.toFixed(2)} KG</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-red-500/80 px-3 py-1.5 rounded-xl">
                                                            <span className="text-[10px] font-black">↓</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">DEC</span>
                                                            <span className="text-sm font-black">-{diaDec.toFixed(2)} KG</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${diaNet >= 0 ? 'bg-emerald-500/80' : 'bg-orange-500/80'}`}>
                                                            <span className="text-[10px] font-black">{diaNet >= 0 ? '↗' : '↘'}</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">NET</span>
                                                            <span className="text-sm font-black">{diaNet >= 0 ? '+' : ''}{diaNet.toFixed(2)} KG</span>
                                                        </div>
                                                        <div className="w-px h-6 bg-white/20" />
                                                        <div className="text-right">
                                                            <div className="text-[8px] font-black uppercase tracking-widest opacity-50">Prev → Current</div>
                                                            <div className="text-sm font-black"><span className="line-through opacity-40">{diaOrigTotal.toFixed(2)}</span> → <span className="text-emerald-400">{diaTotal.toFixed(2)} KG</span></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Color Rows */}
                                                <table className="w-full text-left border-collapse bg-white min-w-[560px]">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 border-b-2 border-black">
                                                            <th className="px-6 py-3 border-r border-gray-200">Color / Variety</th>
                                                            <th className="px-6 py-3 border-r border-gray-200">PCS</th>
                                                            <th className="px-6 py-3 border-r border-gray-200">Prev. Weight (KG)</th>
                                                            <th className="px-6 py-3 border-r border-gray-200">Change</th>
                                                            <th className="px-6 py-3 border-r border-gray-200">Current (KG)</th>
                                                            <th className="px-6 py-3">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-[11px] font-bold uppercase divide-y divide-gray-100">
                                                        {rows.map((item: any, idx: number) => {
                                                            const sessionKey = `${viewingLotHistory._id}-${item.color}`;
                                                            const sessionUpd = sessionUpdates[sessionKey]?.find(u => u.itemId === item._id);

                                                            const historyItems = item.history?.filter((h: any) => h.action === 'Reweighted') || [];
                                                            const originalWeight = historyItems.length > 0 ? historyItems[historyItems.length - 1].oldWeight || item.quantity : item.quantity;

                                                            const currentWeight = sessionUpd ? sessionUpd.newWeight : item.quantity;
                                                            const diff = currentWeight - originalWeight;
                                                            const isProposed = !!sessionUpd;
                                                            const isPersisted = historyItems.length > 0;
                                                            const hasChanged = isProposed || isPersisted;

                                                            return (
                                                                <tr key={idx} className={`${!hasChanged ? 'opacity-50' : isProposed ? 'bg-orange-50/40' : ''}`}>
                                                                    <td className="px-6 py-4 border-r border-gray-100">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0" style={{ backgroundColor: item.color.toLowerCase() }} />
                                                                            <span className="font-black">{item.color}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 border-r border-gray-100 text-gray-500">{item.pcs}</td>
                                                                    <td className="px-6 py-4 border-r border-gray-100 text-gray-400 line-through">{Number(originalWeight).toFixed(2)}</td>
                                                                    <td className={`px-6 py-4 border-r border-gray-100 font-black text-base ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                                                                        {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '—'}
                                                                    </td>
                                                                    <td className={`px-6 py-4 border-r border-gray-100 font-black text-lg ${isProposed ? 'text-orange-600' : isPersisted ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                        {Number(currentWeight).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`px-2 py-1 rounded text-[8px] font-black tracking-widest ${isProposed ? 'bg-orange-600 text-white' : isPersisted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                                            {isProposed ? 'PROPOSED' : isPersisted ? 'CORRECTED' : 'VAL-OK'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

<style jsx global>{`
    @media print {
        .pdf-only { display: flex !important; }
    }
`}</style>
