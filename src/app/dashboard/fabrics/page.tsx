'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Truck,
    Trash2,
    Edit,
    X,
    ChevronDown,
    Eye,
    FileImage,
    Image as ImageIcon
} from 'lucide-react';

export default function InwardPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Dropdown data
    const [parties, setParties] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [activeColorDropdown, setActiveColorDropdown] = useState<number | null>(null);
    const [viewingInward, setViewingInward] = useState<any | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        partyId: '',
        type: 'Fabric',
        inwardDate: new Date().toISOString().split('T')[0],
        challanNo: '',
        lotNo: '',
        billNo: '',
        items: [{
            materialId: '',
            diameter: '',
            pcs: 0,
            color: '',
            quantity: 0,
            unit: 'KG',
            lotNo: '',
            status: 'Pending',
            rejectionCause: ''
        }],
        remarks: '',
        images: [] as string[],
        pendingImageFiles: [] as File[]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [inRes, pRes, mRes, cRes] = await Promise.all([
                fetch('/api/inward'),
                fetch('/api/masters/parties?type=DyeingHouse'),
                fetch('/api/masters/materials?category=Fabric'),
                fetch('/api/masters/colors')
            ]);

            const [inData, pData, mData, cData] = await Promise.all([
                inRes.json(), pRes.json(), mRes.json(), cRes.json()
            ]);

            setInwards(Array.isArray(inData) ? inData : []);
            setParties(pData);
            setMaterials(mData);
            setColors(cData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                materialId: '',
                diameter: '',
                pcs: 0,
                color: '',
                quantity: 0,
                unit: 'KG',
                lotNo: '',
                status: 'Pending',
                rejectionCause: ''
            }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            pendingImageFiles: [...(prev.pendingImageFiles || []), ...files]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setUploadingImage(true);
            let finalImageUrls = [...formData.images];

            // Upload pending files if any
            if (formData.pendingImageFiles && formData.pendingImageFiles.length > 0) {
                const uploadedUrls = await Promise.all(
                    formData.pendingImageFiles.map(async (file) => {
                        const data = new FormData();
                        data.append('file', file);
                        const res = await fetch('/api/upload', { method: 'POST', body: data });
                        const result = await res.json();
                        return result.secure_url;
                    })
                );
                finalImageUrls = [...finalImageUrls, ...uploadedUrls];
            }

            const payload = {
                ...formData,
                images: finalImageUrls
            };
            delete (payload as any).pendingImageFiles;

            const url = editingItem ? `/api/inward/${editingItem._id}` : '/api/inward';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                closeModal();
                fetchData();
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting form. Check console.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDelete = async (id: string, itemId?: string) => {
        const message = itemId ? 'Are you sure you want to delete this specific item?' : 'Are you sure you want to delete this entire receipt?';
        if (!confirm(message)) return;

        try {
            const url = itemId ? `/api/inward/${id}?itemId=${itemId}` : `/api/inward/${id}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (item: any) => {
        console.log("🛠️ handleEdit triggered with item:", JSON.stringify(item, null, 2));
        setEditingItem(item);
        setFormData({
            partyId: item.partyId?._id || item.partyId || '',
            type: item.type || 'Fabric',
            inwardDate: new Date(item.inwardDate).toISOString().split('T')[0],
            challanNo: item.challanNo || '',
            lotNo: item.lotNo || item.items?.[0]?.lotNo || '',
            billNo: item.billNo || '',
            items: item.items.map((i: any) => ({
                materialId: i.materialId?._id || i.materialId || '',
                diameter: i.diameter || '',
                pcs: i.pcs ?? i.pieces ?? i.quantity_pcs ?? 0,
                color: i.color || '',
                quantity: i.quantity || 0,
                unit: i.unit || 'KG',
                lotNo: i.lotNo || item.lotNo || '',
                status: i.status || 'Pending',
                rejectionCause: i.rejectionCause || ''
            })),
            remarks: item.remarks || '',
            images: (item.images || []).map((img: any) => {
                if (typeof img === 'string') return img;
                return img.secure_url || img.url || img.path || '';
            }).filter(Boolean),
            pendingImageFiles: []
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            partyId: '',
            type: 'Fabric',
            inwardDate: new Date().toISOString().split('T')[0],
            challanNo: '',
            lotNo: '',
            billNo: '',
            items: [{
                materialId: '',
                diameter: '',
                pcs: 0,
                color: '',
                quantity: 0,
                unit: 'KG',
                lotNo: '',
                status: 'Pending',
                rejectionCause: ''
            }],
            remarks: '',
            images: [],
            pendingImageFiles: []
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Fabric Inward & Sampling</h1>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-border rounded-lg bg-card hover:bg-secondary transition-colors">
                        <Filter className="w-4 h-4 text-muted" />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Record Dyeing Receipt
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                {/* ... table ... */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">SL NO</th>
                                <th className="px-6 py-4">Lot & Date</th>
                                <th className="px-6 py-4">Dyeing House</th>
                                <th className="px-6 py-4">Total Qty (KG)</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-muted">Loading transactions...</td></tr>
                            ) : inwards.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center">
                                    <Truck className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">No fabric receipts found. Record your first receipt from a dyeing house.</p>
                                </td></tr>
                            ) : (
                                inwards.map((inward, idx) => (
                                    <tr key={inward._id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-bold text-muted">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">Lot: {inward.lotNo || '-'}</div>
                                            <div className="text-[10px] text-muted font-medium bg-secondary/50 px-1.5 py-0.5 rounded w-fit mt-1">
                                                {new Date(inward.inwardDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold">{inward.partyId?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-muted">Challan: {inward.challanNo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-primary">{inward.totalQuantity || inward.items.reduce((acc: number, cur: any) => acc + cur.quantity, 0)} KG</div>
                                            <div className="text-[10px] text-muted font-bold mt-1">{inward.items.reduce((acc: number, cur: any) => acc + (cur.pcs || 0), 0)} PCS</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-muted">
                                                {inward.items.length} Varieties
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingInward(inward)}
                                                    className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(inward)}
                                                    className="p-1.5 hover:bg-primary/10 text-muted hover:text-primary rounded-lg transition-all"
                                                    title="Edit Receipt"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inward._id)}
                                                    className="p-1.5 hover:bg-red-500/10 text-muted hover:text-red-500 rounded-lg transition-all"
                                                    title="Delete Receipt"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Record'} Fabric Receipt</h2>
                            <button onClick={closeModal} className="p-1 hover:bg-card rounded-md">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Dyeing House</label>
                                    <select
                                        required
                                        value={formData.partyId}
                                        onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    >
                                        <option value="">Select Party</option>
                                        {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {/* ... rest of form ... */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Inward Date</label>
                                    <input
                                        type="date"
                                        value={formData.inwardDate}
                                        onChange={(e) => setFormData({ ...formData, inwardDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Challan No.</label>
                                    <input
                                        placeholder="e.g. DY-9922"
                                        value={formData.challanNo}
                                        onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Lot No.</label>
                                    <input
                                        placeholder="e.g. 12345"
                                        value={formData.lotNo}
                                        onChange={(e) => setFormData({ ...formData, lotNo: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-foreground">Items Received</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        + Add Color/Dia
                                    </button>
                                </div>
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.8fr_1.5fr_1fr_auto] gap-4 p-5 bg-secondary/10 rounded-2xl relative border border-border/40 hover:border-border/80 transition-all group/row">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted/60 tracking-wider ml-1">Fabric Type</label>
                                            <select
                                                value={item.materialId}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].materialId = e.target.value;
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full h-9 px-3 bg-background border border-border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Select Type</option>
                                                {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted/60 tracking-wider ml-1">Dia</label>
                                            <input
                                                placeholder="30"
                                                value={item.diameter}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].diameter = e.target.value;
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full h-9 px-3 bg-background border border-border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted/60 tracking-wider ml-1">Pcs</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={item.pcs}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].pcs = Number(e.target.value);
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full h-9 px-3 bg-background border border-border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted/60 tracking-wider ml-1">Color</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveColorDropdown(activeColorDropdown === idx ? null : idx)}
                                                    className="w-full h-9 px-3 bg-background border border-border rounded-xl outline-none text-sm flex items-center justify-between hover:border-primary/40 transition-all focus:ring-2 focus:ring-primary/10"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {item.color ? (
                                                            <>
                                                                <div
                                                                    className="w-3 h-3 rounded-full border border-black/10 shadow-sm"
                                                                    style={{ backgroundColor: colors.find(c => c.name === item.color)?.hexCode || item.color }}
                                                                />
                                                                <span className="text-foreground font-medium">{item.color}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted/50 italic">Select</span>
                                                        )}
                                                    </div>
                                                    <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${activeColorDropdown === idx ? 'rotate-180' : ''}`} />
                                                </button>

                                                {activeColorDropdown === idx && (
                                                    <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[100] max-h-56 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="p-1 overflow-y-auto max-h-56">
                                                            {colors.length === 0 ? (
                                                                <div className="px-3 py-3 text-xs text-muted text-center italic">No colors in master</div>
                                                            ) : (
                                                                colors.map(c => (
                                                                    <button
                                                                        key={c._id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newItems = [...formData.items];
                                                                            newItems[idx].color = c.name;
                                                                            setFormData({ ...formData, items: newItems });
                                                                            setActiveColorDropdown(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-xl transition-colors text-left group"
                                                                    >
                                                                        <div
                                                                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm group-hover:scale-110 transition-transform"
                                                                            style={{ backgroundColor: c.hexCode || c.name.toLowerCase() }}
                                                                        />
                                                                        <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground">{c.name}</span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted/60 tracking-wider ml-1">Wt (KG)</label>
                                            <input
                                                type="number"
                                                placeholder="100.0"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].quantity = Number(e.target.value);
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full h-9 px-3 bg-background border border-border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="flex items-end pb-0.5">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="p-2 text-muted/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Remove Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="p-4 border-2 border-dashed border-border rounded-xl space-y-3">
                                    <div className="flex items-center justify-between text-sm font-bold text-muted uppercase">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            Upload Challan / Fabric Photos (Required)
                                        </div>
                                        {uploadingImage && <span className="text-primary animate-pulse text-[10px]">Uploading...</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <label className={`w-24 h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/30 transition-all text-muted ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Plus className="w-6 h-6" />
                                            <span className="text-[10px] font-bold">Add Image</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                        {formData.images.map((img, i) => (
                                            <div key={`saved-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden group border border-border">
                                                <img
                                                    src={img}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                                    alt="upload"
                                                    onClick={() => setPreviewImage(img)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.pendingImageFiles?.map((file, i) => (
                                            <div key={`pending-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden group border border-border">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                                    alt="preview"
                                                    onClick={() => setPreviewImage(URL.createObjectURL(file))}
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="text-white text-[10px] font-bold">Click to View</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, pendingImageFiles: formData.pendingImageFiles.filter((_, idx) => idx !== i) })}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full z-10"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="absolute bottom-1 left-1 bg-primary px-1.5 py-0.5 rounded text-[8px] text-white font-bold uppercase pointer-events-none">Pending</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-3 border border-border rounded-xl font-bold text-muted hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                                >
                                    {editingItem ? 'Update Receipt' : 'Submit for Sampling'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingInward && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setViewingInward(null)} />
                    <div className="relative bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-border bg-secondary/20 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Receipt Details</h2>
                                <p className="text-sm text-muted">Lot No: <span className="text-primary font-bold">{viewingInward.lotNo}</span> • {new Date(viewingInward.inwardDate).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setViewingInward(null)} className="p-2 hover:bg-secondary rounded-full transition-colors border border-border">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest">Dyeing House / Supplier</p>
                                    <p className="text-lg font-bold">{viewingInward.partyId?.name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest">Challan Reference</p>
                                    <p className="text-lg font-bold">{viewingInward.challanNo || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-muted tracking-widest">Items Receipt List</p>
                                <div className="space-y-3">
                                    {viewingInward.items.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center font-bold text-xs" style={{ backgroundColor: colors.find(c => c.name === item.color)?.hexCode || item.color.toLowerCase() }}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground capitalize">{item.color} - {item.materialId?.name}</p>
                                                    <p className="text-[10px] text-muted font-bold">DIA: {item.diameter} • PCS: {item.pcs || 0}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary">{item.quantity} KG</p>
                                                <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">{item.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {viewingInward.images && viewingInward.images.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest">Attached Photos</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {viewingInward.images.map((img: string, i: number) => (
                                            <div
                                                key={i}
                                                onClick={() => setPreviewImage(img)}
                                                className="flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all active:scale-95"
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt="record" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewingInward.remarks && (
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <p className="text-[10px] font-bold uppercase text-primary mb-1">Office Remarks</p>
                                    <p className="text-sm italic text-muted">"{viewingInward.remarks}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Image Preview Modal (Lightbox) */}
            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setPreviewImage(null)} />
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div className="relative max-w-2xl w-full max-h-[80vh] aspect-auto rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[105] animate-in zoom-in-95 duration-300 border border-white/10">
                        <img
                            src={previewImage}
                            className="w-full h-full object-contain bg-black/40"
                            alt="Maximized Preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
