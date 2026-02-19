'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Package,
    MapPin,
    UserCircle,
    Plus,
    Search,
    Building2,
    Trash2,
    Edit,
    Loader2,
    Phone,
    Hash,
    X,
    Palette,
    FileText,
    Ruler
} from 'lucide-react';
import ConsumptionPanel from '../consumption/page';
import DiameterMappingPanel from '../diameter-mapping/page';

type Tab = 'clients' | 'stitchers' | 'dyeing-houses' | 'suppliers' | 'materials' | 'colors' | 'consumption' | 'diameter-mapping';

export default function MastersPage() {
    const [activeTab, setActiveTab] = useState<Tab>('clients');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        phone: '',
        address: '',
        contactPerson: '',
        gstIn: '',
        category: 'Fabric', // for materials
        unit: 'KG', // for materials
        hexCode: '', // for colors
    });

    const tabConfig: Record<Tab, { label: string; icon: any; apiType?: string; category?: string }> = {
        'clients': { label: 'Clients (LUX/Rupa)', icon: Building2, apiType: 'Client' },
        'stitchers': { label: 'Stitchers', icon: UserCircle, apiType: 'Stitcher' },
        'dyeing-houses': { label: 'Dyeing Houses', icon: MapPin, apiType: 'DyeingHouse' },
        'suppliers': { label: 'Suppliers', icon: Users, apiType: 'Supplier' },
        'materials': { label: 'Materials (BOM)', icon: Package },
        'colors': { label: 'Colors', icon: Palette },
        'consumption': { label: 'Consumption', icon: FileText },
        'diameter-mapping': { label: 'Dia → Size', icon: Ruler },
    };

    const tabs = Object.entries(tabConfig).map(([id, config]) => ({
        id: id as Tab,
        ...config
    }));

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '';
            if (activeTab === 'materials') {
                url = '/api/masters/materials';
            } else if (activeTab === 'colors') {
                url = '/api/masters/colors';
            } else {
                url = `/api/masters/parties?type=${tabConfig[activeTab].apiType}`;
            }

            const res = await fetch(url);
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error(err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let url = '';
            if (activeTab === 'materials') url = '/api/masters/materials';
            else if (activeTab === 'colors') url = '/api/masters/colors';
            else url = '/api/masters/parties';

            // Auto-gen code if empty
            const generatedCode = formData.code || formData.name.slice(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);

            const payload = activeTab === 'materials'
                ? {
                    _id: editingItem?._id,
                    name: formData.name,
                    code: generatedCode,
                    category: formData.category,
                    unit: formData.unit
                }
                : activeTab === 'colors'
                    ? {
                        _id: editingItem?._id,
                        name: formData.name,
                        code: generatedCode,
                        hexCode: formData.hexCode
                    }
                    : {
                        _id: editingItem?._id,
                        name: formData.name,
                        code: generatedCode,
                        type: tabConfig[activeTab].apiType,
                        contactPerson: formData.contactPerson,
                        contactNumber: formData.phone,
                        address: formData.address,
                        gstin: formData.gstIn
                    };

            const res = await fetch(url, {
                method: editingItem ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                closeModal();
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const url = activeTab === 'materials'
                ? `/api/masters/materials?id=${id}`
                : activeTab === 'colors'
                    ? `/api/masters/colors?id=${id}`
                    : `/api/masters/parties?id=${id}`;

            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        if (activeTab === 'materials') {
            setFormData({
                name: item.name,
                code: item.code,
                category: item.category,
                unit: item.unit,
                phone: '',
                address: '',
                contactPerson: '',
                gstIn: '',
                hexCode: '',
            });
        } else if (activeTab === 'colors') {
            setFormData({
                name: item.name,
                code: item.code,
                hexCode: item.hexCode || '',
                phone: '',
                address: '',
                contactPerson: '',
                gstIn: '',
                category: 'Fabric',
                unit: 'KG',
            });
        } else {
            setFormData({
                name: item.name,
                code: item.code,
                phone: item.contactNumber || '',
                address: item.address || '',
                contactPerson: item.contactPerson || '',
                gstIn: item.gstin || '',
                category: 'Fabric',
                unit: 'KG',
                hexCode: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: '', code: '', phone: '', address: '', contactPerson: '', gstIn: '', category: 'Fabric', unit: 'KG', hexCode: '' });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Master Data Management
                    </h1>
                    <p className="text-muted text-sm mt-1">Configure your business entities, quality standards and BOM.</p>
                </div>
                {activeTab !== 'consumption' && activeTab !== 'diameter-mapping' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add {tabConfig[activeTab].label.split(' ')[0]}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl overflow-x-auto no-scrollbar border border-border">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-w-fit ${activeTab === tab.id
                                ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                                : 'text-muted hover:text-foreground hover:bg-card/50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* List / Table - hidden for custom tabs */}
            {activeTab !== 'consumption' && activeTab !== 'diameter-mapping' && (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="text"
                                placeholder={`Search ${tabConfig[activeTab].label.toLowerCase()}...`}
                                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <span className="text-xs text-muted">Showing {data.length} entries</span>
                    </div>

                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-muted">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading records...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                                {React.createElement(tabConfig[activeTab].icon, { className: "w-8 h-8 text-muted" })}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No {tabConfig[activeTab].label} Found</h3>
                            <p className="text-muted max-w-sm mt-1">Start by clicking the "Add" button to populate your data.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-secondary/30 text-[10px] font-bold uppercase text-muted tracking-wider border-b border-border">
                                        <th className="px-6 py-4">SL NO</th>
                                        <th className="px-6 py-4">Name / Code</th>
                                        {activeTab !== 'materials' && activeTab !== 'colors' && (
                                            <>
                                                <th className="px-6 py-4">Contact</th>
                                                <th className="px-6 py-4">Address</th>
                                                <th className="px-6 py-4">GST / ID</th>
                                            </>
                                        )}
                                        {activeTab === 'materials' && (
                                            <>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Unit</th>
                                            </>
                                        )}
                                        {activeTab === 'colors' && (
                                            <>
                                                <th className="px-6 py-4">Preview</th>
                                                <th className="px-6 py-4">Hex Code</th>
                                            </>
                                        )}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-primary/5 transition-all group border-b border-border/50 last:border-0">
                                            <td className="px-6 py-4 text-xs font-bold text-muted">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground">{item.name}</div>
                                                <div className="text-[10px] text-muted font-mono uppercase tracking-tighter">{item.code}</div>
                                            </td>
                                            {activeTab !== 'materials' && activeTab !== 'colors' && (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-foreground">{item.contactPerson || '-'}</div>
                                                        <div className="text-[10px] text-muted">{item.contactNumber}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-muted max-w-[200px] line-clamp-2 leading-relaxed">
                                                            {item.address || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-[11px] text-muted font-mono">{item.gstin || '-'}</td>
                                                </>
                                            )}
                                            {activeTab === 'materials' && (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.category === 'Fabric' ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'
                                                            }`}>
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-foreground">{item.unit}</td>
                                                </>
                                            )}
                                            {activeTab === 'colors' && (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div
                                                            className="w-8 h-8 rounded-full border border-border shadow-sm"
                                                            style={{ backgroundColor: item.hexCode || item.name.toLowerCase() }}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono text-muted">{item.hexCode || 'N/A'}</td>
                                                </>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary transition-all border border-border/50"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-all border border-border/50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Consumption Tab */}
            {activeTab === 'consumption' && (
                <div className="mt-2">
                    <ConsumptionPanel />
                </div>
            )}

            {/* Diameter Mapping Tab */}
            {activeTab === 'diameter-mapping' && (
                <div className="mt-2">
                    <DiameterMappingPanel />
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
                            <h3 className="text-lg font-bold">{editingItem ? 'Edit' : 'Add New'} {tabConfig[activeTab].label.split(' ')[0]}</h3>
                            <button onClick={closeModal} className="p-1 hover:bg-card rounded-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted tracking-wider">
                                    {activeTab === 'colors' ? 'Color Name' : activeTab === 'materials' ? 'Material Name' : 'Business Name / Name'}
                                </label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder={activeTab === 'colors' ? 'e.g. Royal Blue' : activeTab === 'materials' ? 'e.g. Cotton 30s' : 'e.g. LUX Industries Ltd.'}
                                />
                            </div>

                            {activeTab === 'materials' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted tracking-wider">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none"
                                        >
                                            <option>Fabric</option>
                                            <option>Accessory</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted tracking-wider">Base Unit</label>
                                        <input
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none"
                                            placeholder="e.g. KG, PCS, DOZ"
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'colors' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted tracking-wider">Hex Code / Color Picker</label>
                                        <div className="flex gap-4 items-center bg-background p-2 rounded-xl border border-border">
                                            <input
                                                type="color"
                                                value={formData.hexCode || '#000000'}
                                                onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                                                className="w-14 h-11 p-1 bg-background border-0 rounded-lg outline-none cursor-pointer"
                                            />
                                            <div className="h-8 w-[1px] bg-border" />
                                            <input
                                                value={formData.hexCode}
                                                onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                                                className="flex-1 bg-transparent border-0 outline-none font-mono text-sm"
                                                placeholder="#FFFFFF"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted tracking-wider">Manual Code (Optional)</label>
                                        <input
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none uppercase font-mono text-sm focus:ring-2 focus:ring-primary/20"
                                            placeholder="e.g. WH-01 (Leave blank to auto-generate)"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted tracking-wider">Contact Person</label>
                                            <input
                                                value={formData.contactPerson}
                                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted tracking-wider">Phone Number</label>
                                            <input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none"
                                                placeholder="+91..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted tracking-wider">Office Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none"
                                            placeholder="Building, Street, Area..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted tracking-wider">GSTIN / Identity</label>
                                        <input
                                            value={formData.gstIn}
                                            onChange={(e) => setFormData({ ...formData, gstIn: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none font-mono"
                                            placeholder="19XXXXX..."
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 border border-border rounded-xl font-bold text-muted hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                                >
                                    {editingItem ? 'Update Entity' : 'Save Entity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
