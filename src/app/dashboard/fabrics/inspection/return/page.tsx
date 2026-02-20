'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Filter, AlertCircle, Clock, Truck, CheckCircle2, XCircle, X, Palette, Eye, ArrowRight, Trash2 } from 'lucide-react';

export default function FabricReturnPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [returnHistory, setReturnHistory] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

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
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
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

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchInwards(), fetchHistory(), fetchColors()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const flattenedItems = inwards.flatMap(inward =>
        inward.items.filter((item: any) => item.status === 'Rejected' && item.rejectionCause === 'Color')
            .map((item: any) => ({
                ...item,
                inwardId: inward._id,
                challanNo: inward.challanNo,
                partyName: inward.partyId?.name,
                inwardDate: inward.inwardDate,
                globalLotNo: inward.lotNo
            }))
    );

    const filteredPending = flattenedItems.filter(item =>
        item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.lotNo || item.globalLotNo)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = returnHistory.filter(item =>
        item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lotNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.returnChallanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rereceiveChallanNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateReturnStatus = async (inwardId: string, itemId: string, returnStatus: string) => {
        try {
            const res = await fetch(`/api/inward/${inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    returnStatus,
                    itemId
                })
            });
            if (res.ok) {
                await fetchData();
            }
        } catch (err) {
            console.error('Update return status error:', err);
        }
    };

    const openRereceiveModal = (item: any) => {
        setSelectedItem(item);
        setNewColor(item.color);
        setIsModalOpen(true);
    };

    const openReturnModal = (item: any) => {
        setSelectedItem(item);
        setReturnFormData({
            challanNo: item.returnChallanNo || '',
            date: item.returnDate ? new Date(item.returnDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            images: item.returnImages || [],
            pendingFiles: []
        });
        setIsReturnModalOpen(true);
    };

    const openHistoryModal = (item: any) => {
        setSelectedItem(item);
        setIsHistoryModalOpen(true);
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

            const res = await fetch(`/api/inward/${selectedItem.inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: selectedItem._id,
                    returnStatus: 'Returned',
                    returnChallanNo: returnFormData.challanNo,
                    returnDate: returnFormData.date,
                    returnImages: allImages
                })
            });

            if (res.ok) {
                setIsReturnModalOpen(false);
                await fetchData();
            }
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

            const res = await fetch(`/api/inward/${selectedItem.inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Pending',
                    rejectionCause: '',
                    returnStatus: '',
                    color: newColor,
                    itemId: selectedItem._id,
                    // New Rereceive Details
                    quantity: rereceiveFormData.weight,
                    rereceiveChallanNo: rereceiveFormData.challanNo,
                    rereceiveDate: rereceiveFormData.date,
                    rereceiveImages: allImages
                })
            });
            if (res.ok) {
                setIsModalOpen(false);
                await fetchData();
            }
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
                    <p className="text-muted text-sm">Track and manage returns to dyeing houses for rejected fabric items.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search returns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'pending' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
                >
                    Pending Returns ({filteredPending.length})
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'history' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
                >
                    Processed History ({filteredHistory.length})
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
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
                                ) : filteredPending.map((item, idx) => (
                                    <tr key={item._id || `${item.inwardId}-${idx}`} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{item.challanNo}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="text-[10px] text-muted font-medium bg-secondary/50 px-1.5 py-0.5 rounded w-fit">{new Date(item.inwardDate).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-tight">Lot: {item.lotNo || item.globalLotNo || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold">{item.partyName || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-border shadow-sm"
                                                    style={{ backgroundColor: item.color.toLowerCase() }}
                                                ></div>
                                                <span className="text-sm font-semibold text-foreground uppercase tracking-tight">{item.color}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-primary">{item.quantity} KG</div>
                                            <div className="text-[11px] text-muted">
                                                {item.materialId?.name || 'Fabric'} • Dia {item.diameter}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit bg-red-500/10 text-red-600">
                                                    <XCircle className="w-3 h-3" />
                                                    REJECTED
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70 ml-1">
                                                    CAUSE: {item.rejectionCause}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${(item.returnStatus === 'Returned')
                                                ? 'bg-blue-500/10 text-blue-600'
                                                : 'bg-orange-500/10 text-orange-600'
                                                }`}>
                                                {item.returnStatus === 'Returned' ? <Truck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {item.returnStatus || 'Pending'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                {(item.returnStatus === 'Returned') ? (
                                                    <>
                                                        <button
                                                            onClick={() => openHistoryModal(item)}
                                                            className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/history"
                                                            title="View History"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openReturnModal(item)}
                                                            className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/view"
                                                            title="View Return Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateReturnStatus(item.inwardId, item._id, 'Pending')}
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
                                                            Rereceived
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => openHistoryModal(item)}
                                                            className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/history"
                                                            title="View History"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openReturnModal(item)}
                                                            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            <Truck className="w-3 h-3" />
                                                            Return
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
                                    <th className="px-6 py-4">History Timeline</th>
                                    <th className="px-6 py-4">Color Change</th>
                                    <th className="px-6 py-4">Final Weight</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-muted">Loading history...</td></tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr><td colSpan={6} className="p-20 text-center">
                                        <Clock className="w-12 h-12 text-muted mx-auto mb-4" />
                                        <p className="text-muted">No processed return history found.</p>
                                    </td></tr>
                                ) : filteredHistory.map((hist, idx) => (
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
                                                    <span className="text-primary-foreground/50 bg-secondary px-1 rounded">#{hist.returnChallanNo}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="font-bold text-muted uppercase">Received:</span>
                                                    <span className="font-medium">{new Date(hist.rereceiveDate).toLocaleDateString()}</span>
                                                    <span className="text-primary-foreground/50 bg-secondary px-1 rounded">#{hist.rereceiveChallanNo}</span>
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
                                                    onClick={() => openHistoryModal(hist)}
                                                    className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border"
                                                    title="View Detailed History"
                                                >
                                                    <Clock className="w-4 h-4" />
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
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

                                <div className="grid grid-cols-2 gap-4">
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
                                disabled={isUpdating || !newColor || !rereceiveFormData.weight}
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
                            <div className="bg-secondary/30 p-4 rounded-xl flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: selectedItem?.color.toLowerCase() }}></div>
                                <div>
                                    <div className="font-bold">{selectedItem?.color} - {selectedItem?.materialId?.name}</div>
                                    <div className="text-sm text-muted">Quantity: {selectedItem?.quantity} {selectedItem?.unit} (Dia: {selectedItem?.diameter})</div>
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
                                        disabled={selectedItem?.returnStatus === 'Returned'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted/60 tracking-wider ml-1">Return Date</label>
                                    <input
                                        type="date"
                                        value={returnFormData.date}
                                        onChange={(e) => setReturnFormData({ ...returnFormData, date: e.target.value })}
                                        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        disabled={selectedItem?.returnStatus === 'Returned'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted ml-1">Challan / Return Proof Images</label>
                                <div className="flex flex-wrap gap-3">
                                    <label className={`w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/30 transition-all text-muted ${uploadingImage || selectedItem?.returnStatus === 'Returned' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="p-1 bg-secondary rounded-full"><div className="w-4 h-4 border-2 border-muted/50 rotate-90" /></div>
                                        <span className="text-[9px] font-bold">Add Photo</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={handleReturnFileUpload}
                                            disabled={uploadingImage || selectedItem?.returnStatus === 'Returned'}
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
                                {selectedItem?.returnStatus === 'Returned' ? 'Close' : 'Cancel'}
                            </button>
                            {selectedItem?.returnStatus !== 'Returned' && (
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
                                            Confirm Return
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* NEW: History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Item History</h2>
                                    <p className="text-xs text-muted font-bold uppercase tracking-wider">
                                        {selectedItem?.color} - {selectedItem?.materialId?.name}
                                        {selectedItem && ` • Back from ${selectedItem.partyName || selectedItem.partyId?.name || 'Unknown'}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {!selectedItem?.history || selectedItem.history.length === 0 ? (
                                <div className="text-center p-10 text-muted">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    No history records found for this item.
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-border/50 ml-4 space-y-8 pl-8 py-2">
                                    {selectedItem.history.map((event: any, idx: number) => (
                                        <div key={idx} className="relative group">
                                            {/* Timeline Dot */}
                                            <div className={`absolute -left-[39px] top-0 w-5 h-5 rounded-full border-4 border-card ${event.action === 'Returned' ? 'bg-orange-500' :
                                                event.action === 'Rereceived' ? 'bg-green-500' : 'bg-red-500'
                                                }`}></div>

                                            <div className="bg-secondary/20 p-4 rounded-xl border border-border/50 hover:border-border transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${event.action === 'Returned' ? 'bg-orange-500/10 text-orange-600' :
                                                            event.action === 'Rereceived' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                                            }`}>
                                                            {event.action}
                                                        </span>
                                                        <div className="text-[10px] text-muted font-bold mt-1">
                                                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    {event.challanNo && (
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-muted font-bold uppercase">Challan No</div>
                                                            <div className="font-bold text-sm">{event.challanNo}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                                    {event.quantity && (
                                                        <div>
                                                            <span className="text-muted text-xs">Quantity:</span>
                                                            <span className="font-bold ml-1">{event.quantity} KG</span>
                                                        </div>
                                                    )}
                                                    {event.color && (
                                                        <div>
                                                            <span className="text-muted text-xs">Color:</span>
                                                            <span className="font-bold ml-1">{event.color}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {event.images && event.images.length > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-border/50">
                                                        <div className="text-[10px] font-bold text-muted uppercase mb-2">Attached Documents</div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {event.images.map((img: string, i: number) => (
                                                                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity">
                                                                    <img src={img} className="w-full h-full object-cover" alt="History doc" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border bg-secondary/10">
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="w-full px-4 py-3 border border-border bg-card hover:bg-secondary text-foreground font-bold rounded-xl transition-all"
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
