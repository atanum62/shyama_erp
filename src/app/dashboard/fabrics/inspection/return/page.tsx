'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Search, Filter, AlertCircle, Truck, CheckCircle2, XCircle, X, Palette, Eye, ArrowRight, Trash2, FileText, Printer, CheckCircle, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FabricReturnPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [returnHistory, setReturnHistory] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [systemSettings, setSystemSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});

    // Rereceive Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [newColor, setNewColor] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Rereceive Modal State
    const [rereceiveFormData, setRereceiveFormData] = useState({
        challanNo: '',
        date: new Date().toISOString().split('T')[0],
        weight: '',
        itemWeights: {} as Record<string, string>,
        images: [] as string[],
        pendingFiles: [] as File[]
    });

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnFormData, setReturnFormData] = useState({
        challanNo: '',
        date: new Date().toISOString().split('T')[0],
        images: [] as string[],
        pendingFiles: [] as File[]
    });

    // History Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchInwards = async () => {
        try {
            const res = await fetch('/api/inward');
            if (res.ok) {
                const data = await res.json();
                setInwards(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Fetch inward error:', err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/fabrics/return-history');
            if (res.ok) {
                const data = await res.json();
                setReturnHistory(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Fetch history error:', err);
        }
    };

    const fetchColors = async () => {
        try {
            const res = await fetch('/api/masters/colors');
            if (res.ok) {
                const data = await res.json();
                setColors(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Fetch colors error:', err);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/system/settings');
            if (res.ok) {
                const data = await res.json();
                setSystemSettings(data);
            }
        } catch (err) {
            console.error('Fetch settings error:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchInwards(), fetchHistory(), fetchColors(), fetchSettings()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const flattenedItems = inwards.reduce((acc: any[], inward: any) => {
        const rejectedItems = inward.items.filter((item: any) => item.status === 'Rejected' && item.rejectionCause === 'Color');
        if (rejectedItems.length === 0) return acc;

        const subgroups: Record<string, any[]> = {};
        rejectedItems.forEach((item: any) => {
            const status = (item.returnStatus as string) || 'Pending';
            if (!subgroups[status]) subgroups[status] = [];
            subgroups[status].push({
                ...item,
                inwardId: inward._id,
                partyName: inward.partyId?.name,
                inwardDate: inward.inwardDate,
                globalLotNo: inward.lotNo,
                challanNo: inward.challanNo,
                returnStatus: status
            });
        });

        Object.entries(subgroups).forEach(([status, items]) => {
            acc.push({
                _id: `${inward._id}-${status}`,
                inwardId: inward._id,
                lotNo: items[0].lotNo || items[0].globalLotNo || inward.lotNo,
                challanNo: inward.challanNo,
                partyName: inward.partyId?.name,
                inwardDate: inward.inwardDate,
                returnStatus: status,
                items: items,
                quantity: items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0),
                totalPcs: items.reduce((sum, it) => sum + (Number(it.pcs) || 0), 0),
                color: Array.from(new Set(items.map(it => it.color))).join(', '),
                materialName: Array.from(new Set(items.map(it => it.materialId?.name || 'Fabric'))).join(', '),
                diaList: Array.from(new Set(items.map(it => it.diameter))).join(', '),
                rejectionCause: items[0].rejectionCause,
                isGroup: true
            });
        });
        return acc;
    }, []);

    const filteredPending = useMemo(() => {
        return flattenedItems.filter(item =>
            item.returnStatus === 'Pending' && (
                item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.lotNo || item.globalLotNo)?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [flattenedItems, searchTerm]);

    const activeReturned = useMemo(() => {
        return flattenedItems.filter(item =>
            item.returnStatus === 'Returned' && (
                item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.lotNo || item.globalLotNo)?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [flattenedItems, searchTerm]);

    const filteredHistory = useMemo(() => {
        return returnHistory.filter(item =>
            item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.partyId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lotNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.returnChallanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.rereceiveChallanNo?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [returnHistory, searchTerm]);

    // Dashboard Analytics Logic
    const dashboardStats = useMemo(() => {
        const pendingCount = filteredPending.length;
        const pendingWeight = filteredPending.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const atDyeingCount = activeReturned.length;
        const totalHistoryCount = filteredHistory.length;

        return {
            pendingCount,
            pendingWeight: pendingWeight.toFixed(1),
            atDyeingCount,
            totalHistoryCount
        };
    }, [filteredPending, activeReturned, filteredHistory]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const data = activeTab === 'pending' ? filteredPending : [...activeReturned, ...filteredHistory];
        return data.slice(start, start + rowsPerPage);
    }, [activeTab, filteredPending, activeReturned, filteredHistory, currentPage, rowsPerPage]);

    const totalPages = Math.ceil((activeTab === 'pending' ? filteredPending.length : (activeReturned.length + filteredHistory.length)) / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab, rowsPerPage]);

    const handleUpdateReturnStatus = async (inwardId: string, itemId: string | string[], returnStatus: string) => {
        try {
            const itemIds = Array.isArray(itemId) ? itemId : [itemId];
            await Promise.all(itemIds.map(async (id) => {
                return fetch(`/api/inward/${inwardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        returnStatus,
                        itemId: id
                    })
                });
            }));
            await fetchData();
        } catch (err) {
            console.error('Update return status error:', err);
        }
    };

    const openRereceiveModal = (item: any) => {
        setSelectedItem(item);
        const weights: Record<string, string> = {};
        if (item.isGroup) {
            item.items.forEach((it: any) => {
                weights[it._id] = it.quantity.toString();
            });
            setNewColor(item.items[0].color);
        } else {
            setNewColor(item.color);
        }

        setRereceiveFormData({
            challanNo: '',
            date: new Date().toISOString().split('T')[0],
            weight: item.isGroup ? '' : item.quantity.toString(),
            itemWeights: weights,
            images: [],
            pendingFiles: []
        });
        setIsModalOpen(true);
    };

    const openReturnModal = (item: any) => {
        const baseItem = item.isGroup ? item.items[0] : item;
        setSelectedItem(item);
        setReturnFormData({
            challanNo: baseItem.returnChallanNo || '',
            date: baseItem.returnDate ? new Date(baseItem.returnDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            images: baseItem.returnImages || [],
            pendingFiles: []
        });
        setIsReturnModalOpen(true);
    };

    const openDetailedView = (item: any) => {
        // Normalize history record for the preview if it's from ReturnHistory
        if (item.partyId && !item.partyName) {
            const normalized = {
                ...item,
                partyName: item.partyId.name,
                materialName: item.materialId?.name,
                quantity: item.originalQuantity || item.receivedQuantity,
                items: [{
                    color: item.originalColor || item.previousColor,
                    materialId: item.materialId,
                    diameter: item.diameter,
                    quantity: item.originalQuantity || item.receivedQuantity,
                    pcs: item.pcs || item.totalPcs,
                    rejectionCause: item.rejectionCause || 'Color Rejection'
                }]
            };
            setSelectedItem(normalized);
        } else {
            setSelectedItem(item);
        }
        setIsDetailModalOpen(true);
    };


    const handleReturnFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        setReturnFormData(prev => ({
            ...prev,
            pendingFiles: [...prev.pendingFiles, ...files]
        }));
    };

    const handleConfirmReturn = async () => {
        if (!selectedItem) return;
        setIsUpdating(true);
        setUploadingImage(true);

        try {
            // Upload images first
            let uploadedUrls: string[] = [];
            if (returnFormData.pendingFiles.length > 0) {
                uploadedUrls = await Promise.all(
                    returnFormData.pendingFiles.map(async (file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        return data.url || data.secure_url;
                    })
                );
            }

            const allImages = [...returnFormData.images, ...uploadedUrls];

            const updateItems = selectedItem.isGroup ? selectedItem.items : [selectedItem];
            await Promise.all(updateItems.map(async (item: any) => {
                await fetch(`/api/inward/${selectedItem.inwardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: item._id,
                        returnStatus: 'Returned',
                        returnChallanNo: returnFormData.challanNo,
                        returnDate: returnFormData.date,
                        returnImages: allImages
                    })
                });
            }));

            setIsReturnModalOpen(false);
            await fetchData();
        } catch (err) {
            console.error('Return confirmation error:', err);
            alert('Failed to process return. Check console.');
        } finally {
            setIsUpdating(false);
            setUploadingImage(false);
        }
    };

    const handleRereceiveFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        setRereceiveFormData(prev => ({
            ...prev,
            pendingFiles: [...(prev.pendingFiles || []), ...files]
        }));
    };

    const handleRereceiveAndReset = async () => {
        if (!selectedItem || !newColor) return;

        setIsUpdating(true);
        setUploadingImage(true);
        try {
            // Upload images first
            let uploadedUrls: string[] = [];
            if (rereceiveFormData.pendingFiles.length > 0) {
                uploadedUrls = await Promise.all(
                    rereceiveFormData.pendingFiles.map(async (file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        return data.url || data.secure_url;
                    })
                );
            }

            const allImages = [...rereceiveFormData.images, ...uploadedUrls];

            const updateItems = selectedItem.isGroup ? selectedItem.items : [selectedItem];

            await Promise.all(updateItems.map(async (item: any) => {
                const finalWeight = selectedItem.isGroup ? (rereceiveFormData.itemWeights[item._id] || item.quantity) : rereceiveFormData.weight;

                return fetch(`/api/inward/${selectedItem.inwardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'Pending',
                        rejectionCause: '',
                        returnStatus: '',
                        color: newColor,
                        itemId: item._id,
                        quantity: finalWeight,
                        rereceiveChallanNo: rereceiveFormData.challanNo,
                        rereceiveDate: rereceiveFormData.date,
                        rereceiveImages: allImages
                    })
                });
            }));

            setIsModalOpen(false);
            await fetchData();
        } catch (err) {
            console.error('Rereceive error:', err);
        } finally {
            setIsUpdating(false);
            setUploadingImage(false);
        }
    };

    const handleDeleteHistory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this history record? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/fabrics/return-history?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchHistory();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete history record');
            }
        } catch (err) {
            console.error('Delete history error:', err);
            alert('An error occurred while deleting the record');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Fabric Return Management</h1>
                    <p className="text-muted text-sm font-medium">Manage color-rejected lots and track redyeing from dyeing houses.</p>
                </div>
            </div>

            {/* Overview Analytics Grid */}
            {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.pendingCount} <span className="text-[10px] text-muted font-bold">Groups</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Pending Returns</p>
                    </div>

                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.pendingWeight} <span className="text-[10px] text-muted font-bold">KG</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Total Return Volume</p>
                    </div>

                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <Truck className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.atDyeingCount} <span className="text-[10px] text-muted font-bold">Lots</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Currently at Dyeing</p>
                    </div>

                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{dashboardStats.totalHistoryCount} <span className="text-[10px] text-muted font-bold">Logs</span></h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Total Return History</p>
                    </div>
                </div>
            )}

            {/* Controls Bar: Search, Pagination, Rows */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search by lot or color..."
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

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest mr-2">
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
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/5">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:bg-secondary'}`}
                        >
                            Pending Returns ({filteredPending.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:bg-secondary'}`}
                        >
                            Return History ({filteredHistory.length + activeReturned.length})
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'pending' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                    <th className="px-6 py-4">Inward Details</th>
                                    <th className="px-6 py-4">Dyeing House</th>
                                    <th className="px-6 py-4">Fabric Color</th>
                                    <th className="px-6 py-4">Fabric Item</th>
                                    <th className="px-6 py-4 text-center">Reason</th>
                                    <th className="px-6 py-4 text-center">Return Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan={7} className="p-10 text-center text-muted">Loading return items...</td></tr>
                                ) : filteredPending.length === 0 ? (
                                    <tr><td colSpan={7} className="p-20 text-center">
                                        <RotateCcw className="w-12 h-12 text-muted mx-auto mb-4" />
                                        <p className="text-muted">No pending color returns found.</p>
                                    </td></tr>
                                ) : (paginatedItems as any[]).map((item, idx) => (
                                    <tr key={item._id || `${item.inwardId}-${idx}`} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{item.challanNo}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="text-[10px] text-muted font-medium bg-secondary/50 px-1.5 py-0.5 rounded w-fit">{new Date(item.inwardDate).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-tight">Lot: {item.lotNo || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold">{item.partyName || 'Unknown'}</div>
                                            {item.isGroup && item.items.length > 1 && (
                                                <div className="text-[9px] font-bold text-muted uppercase tracking-tighter mt-1">{item.items.length} Items in Group</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 relative">
                                            <button
                                                onClick={() => setExpandedRows(prev => ({ ...prev, [item.lotNo + item.returnStatus]: !prev[item.lotNo + item.returnStatus] }))}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 hover:bg-secondary rounded-lg transition-all group"
                                            >
                                                <Palette className="w-4 h-4 text-primary" />
                                                <span className="text-xs font-bold">View Colors</span>
                                                <ChevronRight className={`w-3 h-3 transition-transform ${expandedRows[item.lotNo + item.returnStatus] ? 'rotate-90' : ''}`} />
                                            </button>
                                            {expandedRows[item.lotNo + item.returnStatus] && (
                                                <div className="absolute z-10 mt-2 p-3 bg-card border border-border rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 w-max max-w-[300px]">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.isGroup ? item.items.map((it: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-2 bg-secondary/20 px-2 py-1 rounded-md">
                                                                <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: it.color.toLowerCase() }}></div>
                                                                <span className="text-[10px] font-bold">{it.color}</span>
                                                            </div>
                                                        )) : (
                                                            <div className="flex items-center gap-2 bg-secondary/20 px-2 py-1 rounded-md">
                                                                <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: item.color.toLowerCase() }}></div>
                                                                <span className="text-[10px] font-bold">{item.color}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-primary">{Number(item.quantity).toFixed(2)} KG</div>
                                            <div className="text-[11px] text-muted">
                                                {item.materialName} • Dia {item.diaList}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-center text-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit bg-red-500/10 text-red-600">
                                                    <XCircle className="w-3 h-3" />
                                                    REJECTED
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">
                                                    CAUSE: {item.rejectionCause}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${(item.returnStatus === 'Returned')
                                                ? 'bg-blue-500/10 text-blue-600'
                                                : 'bg-orange-500/10 text-orange-600'
                                                }`}>
                                                {item.returnStatus === 'Returned' && <Truck className="w-3 h-3" />}
                                                {item.returnStatus || 'Pending'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                {(item.returnStatus === 'Returned') ? (
                                                    <>
                                                        <button
                                                            onClick={() => openReturnModal(item)}
                                                            className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/view"
                                                            title="View Return Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateReturnStatus(item.inwardId, item.isGroup ? item.items.map((it: any) => it._id) : item._id, 'Pending')}
                                                            className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/reset"
                                                            title="Reset to Pending"
                                                        >
                                                            <RotateCcw className="w-4 h-4 group-hover/reset:rotate-[-45deg] transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => openRereceiveModal(item)}
                                                            className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Rereceive
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => openDetailedView(item)}
                                                            className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/detail"
                                                            title="Detailed View (Doc Format)"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openReturnModal(item)}
                                                            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            <Truck className="w-3 h-3" />
                                                            Return Lot
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                    <th className="px-6 py-4">Inward Details</th>
                                    <th className="px-6 py-4">Dyeing House</th>
                                    <th className="px-6 py-4">Status / Timeline</th>
                                    <th className="px-6 py-4">Color Details</th>
                                    <th className="px-6 py-4">Weight</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-muted">Loading history...</td></tr>
                                ) : (filteredHistory.length === 0 && activeReturned.length === 0) ? (
                                    <tr><td colSpan={6} className="p-20 text-center">
                                        <RotateCcw className="w-12 h-12 text-muted mx-auto mb-4" />
                                        <p className="text-muted">No return history found.</p>
                                    </td></tr>
                                ) : (
                                    <>
                                        {/* Combined Paginated Data for History Tab */}
                                        {(paginatedItems as any[]).map((item, idx) => {
                                            if (item.returnStatus === 'Returned') {
                                                return (
                                                    <tr key={`active-${item._id}`} className="hover:bg-orange-500/5 transition-colors border-l-4 border-orange-500/20">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-foreground">{item.challanNo}</div>
                                                            <div className="text-[10px] text-orange-600 font-black bg-orange-500/5 px-1.5 py-0.5 rounded border border-orange-500/10 uppercase tracking-tight w-fit mt-1">
                                                                Lot: {item.lotNo || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-semibold">{item.partyName || 'Unknown'}</div>
                                                            <div className="text-[10px] text-muted">{item.materialName}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 animate-pulse">
                                                                <Truck className="w-3 h-3" />
                                                                RETURNED (AWAITING)
                                                            </div>
                                                            <div className="text-[9px] text-muted mt-1 font-medium">Sent: {new Date(item.items?.[0]?.returnDate || Date.now()).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.color?.toLowerCase() }}></div>
                                                                    <span className="text-[11px] font-bold">{item.color}</span>
                                                                </div>
                                                                <div className="text-[9px] text-muted uppercase mt-0.5">Original Color</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-foreground">{Number(item.quantity).toFixed(2)} KG</div>
                                                            <div className="text-[10px] text-muted">{item.totalPcs} PCS</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <button
                                                                    onClick={() => openDetailedView(item)}
                                                                    className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/detail"
                                                                    title="Detailed View (Doc Format)"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => openReturnModal(item)}
                                                                    className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/edit"
                                                                    title="Edit Return Information"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateReturnStatus(item.inwardId, item.items.map((it: any) => it._id), 'Pending')}
                                                                    className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/reset"
                                                                    title="Reset to Pending"
                                                                >
                                                                    <RotateCcw className="w-4 h-4 group-hover/reset:rotate-[-45deg] transition-transform" />
                                                                </button>
                                                                <button
                                                                    onClick={() => openRereceiveModal(item)}
                                                                    className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm flex items-center gap-1"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Rereceive
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            } else {
                                                const hist = item;
                                                return (
                                                    <tr key={hist._id || idx} className="hover:bg-secondary/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-foreground">{hist.challanNo}</div>
                                                            <div className="text-[10px] text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-tight w-fit mt-1">Lot: {hist.lotNo || '-'}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-semibold">{hist.partyId?.name || 'Unknown'}</div>
                                                            <div className="text-[10px] text-muted">{hist.materialId?.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2 text-[10px]">
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                                    <span className="font-bold text-muted uppercase">Returned:</span>
                                                                    <span className="font-medium">{new Date(hist.returnDate).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px]">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                    <span className="font-bold text-muted uppercase">Received:</span>
                                                                    <span className="font-medium">{new Date(hist.rereceiveDate).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: (hist.previousColor || hist.originalColor)?.toLowerCase() }}></div>
                                                                    <span className="text-[9px] font-bold text-muted uppercase mt-0.5">{hist.previousColor || hist.originalColor}</span>
                                                                </div>
                                                                <ArrowRight className="w-3 h-3 text-muted" />
                                                                <div className="flex flex-col items-center">
                                                                    <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: hist.newColor?.toLowerCase() }}></div>
                                                                    <span className="text-[9px] font-bold text-primary uppercase mt-0.5">{hist.newColor}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-foreground">{hist.receivedQuantity} KG</div>
                                                            <div className="text-[10px] text-muted">Was: {hist.originalQuantity} KG</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <button
                                                                    onClick={() => openDetailedView(hist)}
                                                                    className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/view"
                                                                    title="View Return Advice Document"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteHistory(hist._id)}
                                                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg transition-all border border-red-500/20"
                                                                    title="Delete History Record"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        })}
                                    </>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border bg-secondary/10 flex items-center justify-between">
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, (activeTab === 'pending' ? filteredPending.length : (activeReturned.length + filteredHistory.length)))} of {(activeTab === 'pending' ? filteredPending.length : (activeReturned.length + filteredHistory.length))} records
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

            {/* Rereceive Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Receive Redyed Fabric</h2>
                                    <p className="text-xs text-muted font-bold uppercase tracking-wider">Back from {selectedItem?.partyName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="bg-secondary/30 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Original Return:</span>
                                    <span className="font-bold">{selectedItem?.returnDate ? new Date(selectedItem.returnDate).toLocaleDateString() : '-'} (Challan: {selectedItem?.returnChallanNo || '-'})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Fabric Type:</span>
                                    <span className="font-bold">{selectedItem?.materialId?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Original Color:</span>
                                    <span className="font-bold text-red-500">{selectedItem?.color}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">New Redyed Color</label>
                                    <div className="relative">
                                        <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted z-10" />
                                        <select
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="">Select a color</option>
                                            {colors.map((color) => (
                                                <option key={color._id} value={color.name}>
                                                    {color.name}
                                                </option>
                                            ))}
                                            {!colors.some(c => c.name === selectedItem?.color) && (
                                                <option value={selectedItem?.color}>{selectedItem?.color} (Current)</option>
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <RotateCcw className="w-4 h-4 text-muted rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedItem.isGroup ? (
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">Received Weights per Item</label>
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {selectedItem.items.map((it: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl border border-border">
                                                        <div className="w-8 h-8 rounded-full flex-shrink-0 border border-border" style={{ backgroundColor: it.color.toLowerCase() }}></div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[10px] font-bold truncate">{it.materialId?.name || 'Fabric'} (Dia {it.diameter})</div>
                                                            <div className="text-[9px] text-muted">Original: {it.quantity} KG</div>
                                                        </div>
                                                        <div className="w-24">
                                                            <input
                                                                type="number"
                                                                value={rereceiveFormData.itemWeights[it._id] || ''}
                                                                onChange={(e) => setRereceiveFormData({
                                                                    ...rereceiveFormData,
                                                                    itemWeights: { ...rereceiveFormData.itemWeights, [it._id]: e.target.value }
                                                                })}
                                                                placeholder="0.00"
                                                                className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">Final Weight (KG)</label>
                                            <input
                                                type="number"
                                                value={rereceiveFormData.weight}
                                                onChange={(e) => setRereceiveFormData({ ...rereceiveFormData, weight: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">Receive Date</label>
                                        <input
                                            type="date"
                                            value={rereceiveFormData.date}
                                            onChange={(e) => setRereceiveFormData({ ...rereceiveFormData, date: e.target.value })}
                                            className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">New Challan No</label>
                                    <input
                                        type="text"
                                        value={rereceiveFormData.challanNo}
                                        onChange={(e) => setRereceiveFormData({ ...rereceiveFormData, challanNo: e.target.value })}
                                        placeholder="e.g. DY-NEW-9922"
                                        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted ml-1">Challan / Receive Proof</label>
                                    <div className="flex flex-wrap gap-3">
                                        <label className={`w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/30 transition-all text-muted ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div className="p-1 bg-secondary rounded-full"><div className="w-4 h-4 border-2 border-muted/50 rotate-90" /></div>
                                            <span className="text-[9px] font-bold">Add Photo</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept="image/*"
                                                onChange={handleRereceiveFileUpload}
                                                disabled={uploadingImage}
                                            />
                                        </label>

                                        {/* Previews */}
                                        {rereceiveFormData.pendingFiles.map((file, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                                <button
                                                    onClick={() => setRereceiveFormData(prev => ({ ...prev, pendingFiles: prev.pendingFiles.filter((_, idx) => idx !== i) }))}
                                                    className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-secondary/10 flex gap-3 mt-auto">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 border border-border bg-card hover:bg-secondary text-foreground font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRereceiveAndReset}
                                disabled={isUpdating || !newColor || (selectedItem.isGroup ? false : !rereceiveFormData.weight)}
                                className="flex-[2] px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUpdating ? 'Updating...' : 'Confirm Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* NEW: Return Details Modal */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Truck className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Process Return</h2>
                                    <p className="text-xs text-muted font-bold uppercase tracking-wider">Returning to {selectedItem?.partyName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Item Summary */}
                            <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                                    <span className="text-xs font-bold text-muted uppercase">Items to Return</span>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{selectedItem.isGroup ? selectedItem.items.length : 1} TOTAL</span>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(selectedItem.isGroup ? selectedItem.items : [selectedItem]).map((it: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-center bg-card p-2 rounded-lg border border-border/10">
                                            <div className="w-8 h-8 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: it.color.toLowerCase() }}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-[11px] truncate">{it.color} • {it.materialId?.name}</div>
                                                <div className="text-[10px] text-muted">{it.quantity} KG (Dia {it.diameter})</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2 flex justify-between items-center text-sm font-black border-t border-border/50">
                                    <span className="text-muted text-xs uppercase">Total Return Weight</span>
                                    <span className="text-primary text-lg tracking-tight">{Number(selectedItem.quantity || 0).toFixed(2)} KG</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">Return Challan No</label>
                                    <input
                                        type="text"
                                        value={returnFormData.challanNo}
                                        onChange={(e) => setReturnFormData({ ...returnFormData, challanNo: e.target.value })}
                                        placeholder="e.g. RET-001"
                                        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">Return Date</label>
                                    <input
                                        type="date"
                                        value={returnFormData.date}
                                        onChange={(e) => setReturnFormData({ ...returnFormData, date: e.target.value })}
                                        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted ml-1">Challan / Return Proof Images</label>
                                <div className="flex flex-wrap gap-3">
                                    <label className={`w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/30 transition-all text-muted ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="p-1 bg-secondary rounded-full"><div className="w-4 h-4 border-2 border-muted/50 rotate-90" /></div>
                                        <span className="text-[9px] font-bold">Add Photo</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={handleReturnFileUpload}
                                            disabled={uploadingImage}
                                        />
                                    </label>

                                    {/* Existing Return Images (Read Only) */}
                                    {returnFormData.images.map((img, i) => (
                                        <div key={`saved-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                                            <img src={img} className="w-full h-full object-cover" alt="saved" />
                                        </div>
                                    ))}

                                    {/* Previews */}
                                    {returnFormData.pendingFiles.map((file, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                            <button
                                                onClick={() => setReturnFormData(prev => ({ ...prev, pendingFiles: prev.pendingFiles.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-secondary/10 flex gap-3 mt-auto">
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="flex-1 px-4 py-3 border border-border bg-card hover:bg-secondary text-foreground font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReturn}
                                disabled={isUpdating || !returnFormData.challanNo}
                                className="flex-[2] px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        {selectedItem?.returnStatus === 'Returned' ? 'Update Information' : 'Confirm Return'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* NEW: Detailed View Modal (PDF Format) */}
            {isDetailModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] overflow-y-auto flex justify-center py-10 px-4">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 h-fit">
                        {/* Action Header (Not part of print) */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl print:hidden">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                <span className="font-bold text-gray-700">Return Document Preview</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Document
                                </button>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="p-6 md:p-12 print:p-0" id="return-document">
                            <div className="bg-white text-black font-serif p-4 md:p-10 border border-gray-100 shadow-sm print:shadow-none print:border-none rounded-xl">
                                {/* Letterhead */}
                                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1">{systemSettings?.companyName || 'SHYAMA FABRICS'}</h1>
                                        <div className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground">Quality Fabric & Processing Unit</div>
                                        <div className="text-[9px] md:text-[10px] text-muted-foreground mt-4 leading-relaxed max-w-[250px]">
                                            {systemSettings?.address || 'Office Address details from Master Data'}<br />
                                            {systemSettings?.email && `Email: ${systemSettings.email}`} {systemSettings?.contactNumber && `| Contact: ${systemSettings.contactNumber}`}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl md:text-2xl font-black mb-1">RETURN ADVICE</div>
                                        <div className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase opacity-50 mb-6">Original Copy</div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] md:text-[10px]"><span className="font-black text-gray-400">LOT NO:</span> <span className="font-bold ml-2 underline underline-offset-4 decoration-black/20 text-sm tracking-tight">{selectedItem.lotNo}</span></div>
                                            <div className="text-[9px] md:text-[10px]"><span className="font-black text-gray-400">DATE:</span> <span className="font-bold ml-2">{new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                                            <div className="text-[9px] md:text-[10px]"><span className="font-black text-gray-400">STATUS:</span> <span className="font-bold ml-2 text-red-600">REJECTION RETURN</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Addresses */}
                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return To (Dyeing House)</div>
                                        <div className="text-lg font-black tracking-tight">{selectedItem.partyName}</div>
                                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                                            Assigned Processing Unit<br />
                                            Subject: Color Rejection & Reprocessing
                                        </div>
                                    </div>
                                    <div className="space-y-2 bg-slate-50 p-4 border-l-4 border-slate-900 rounded-r-lg">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Inward</div>
                                        <div className="text-md font-bold underline underline-offset-4 decoration-black/10">Inward No: {selectedItem.challanNo}</div>
                                        <div className="text-[10px] text-muted-foreground">Original Receipt: {new Date(selectedItem.inwardDate).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 bg-slate-50 text-slate-900 text-[9px] font-black uppercase tracking-widest p-4 rounded-t-lg border border-slate-200 border-b-slate-300">
                                    <div className="col-span-1 text-center">Sr.</div>
                                    <div className="col-span-3 text-left px-4">Fabric Color / Description</div>
                                    <div className="col-span-1 text-center">Dia</div>
                                    <div className="col-span-2 text-center text-primary">Pcs</div>
                                    <div className="col-span-2 text-center">Gross Wt. (KG)</div>
                                    <div className="col-span-3 text-right">Reason for Return</div>
                                </div>

                                {/* Table Body */}
                                <div className="border-x border-b border-gray-100 divide-y divide-gray-100 rounded-b-lg overflow-hidden">
                                    {(selectedItem.isGroup ? selectedItem.items : [selectedItem]).map((it: any, i: number) => (
                                        <div key={i} className="grid grid-cols-12 text-[10px] md:text-[11px] p-3 md:p-5 font-medium hover:bg-gray-50/50 transition-colors">
                                            <div className="col-span-1 text-center font-bold text-gray-400">{i + 1}</div>
                                            <div className="col-span-3 px-2 md:px-4">
                                                <div className="font-black text-xs md:text-sm tracking-tight">{it.color}</div>
                                                <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase">{it.materialId?.name || 'Fabric Group'}</div>
                                            </div>
                                            <div className="col-span-1 text-center text-gray-500 font-bold">{it.diameter || '-'}</div>
                                            <div className="col-span-2 text-center">
                                                <span className="text-xs md:text-md font-black bg-primary/5 px-2 py-1 rounded text-primary">{it.pcs || '-'}</span>
                                            </div>
                                            <div className="col-span-2 text-center text-sm md:text-lg font-black tracking-tighter">{Number(it.quantity).toFixed(2)}</div>
                                            <div className="col-span-3 text-right font-black italic text-red-600 bg-red-50/30 px-2 md:px-3 py-1 rounded border border-red-100/50 flex flex-col justify-center items-end">
                                                <span className="text-[7px] md:text-[8px] uppercase font-bold opacity-50 mb-0.5">Rejected For</span>
                                                <span className="text-[9px] md:text-[10px]">{it.rejectionCause || 'COLOR OUT'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary Footer */}
                                <div className="mt-8 flex justify-end gap-4">
                                    <div className="flex-1 max-w-[400px]">
                                        <div className="flex justify-between items-center bg-slate-100/50 text-slate-900 p-3 md:p-4 rounded-2xl border border-slate-200">
                                            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Total Pieces</span>
                                            <div className="text-xl md:text-2xl font-black tracking-tighter mr-2">
                                                {selectedItem.totalPcs || selectedItem.items?.reduce((s: any, i: any) => s + (Number(i.pcs) || 0), 0) || '-'} <span className="text-xs opacity-50 uppercase">PCS</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-[400px] space-y-3">
                                        <div className="flex justify-between items-center bg-slate-50 text-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border-2 border-slate-200">
                                            <div className="flex flex-col border-r border-slate-200 pr-6 mr-6">
                                                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Return Weight</span>
                                                <span className="text-[8px] md:text-[10px] text-slate-300 font-bold uppercase mt-0.5">Verified Balance</span>
                                            </div>
                                            <div className="text-2xl md:text-4xl font-black tracking-tighter whitespace-nowrap flex items-baseline gap-2 text-slate-900">
                                                {Number(selectedItem.quantity).toFixed(2)}
                                                <span className="text-sm md:text-lg text-slate-400 font-bold italic">KG</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Block */}
                                <div className="mt-24 grid grid-cols-2 gap-24 pt-12 border-t-2 border-gray-50">
                                    <div>
                                        <div className="h-16 w-32 border-b-2 border-dashed border-gray-300 mb-2"></div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Authorized Signature</div>
                                        <div className="text-[9px] text-muted-foreground uppercase opacity-50 mt-1">{systemSettings?.companyName || 'Shyama Fabrics'} Quality Dept.</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="h-16 w-32 border-b-2 border-dashed border-gray-300 mb-2"></div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Dyeing Representative</div>
                                        <div className="text-[9px] text-muted-foreground uppercase opacity-50 mt-1">Acknowledgment of Receipt</div>
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div className="mt-20 text-[9px] text-center text-muted-foreground italic leading-relaxed opacity-40">
                                    "This is a computer generated document issued for quality reconcile purposes. Please ensure the fabric is redyed to match the approved standard before Rereceiving."
                                </div>
                            </div>
                        </div>
                    </div>

                    <style jsx global>{`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #return-document, #return-document * {
                                visibility: visible;
                            }
                            #return-document {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                            .print\\:hidden {
                                display: none !important;
                            }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}

