'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    Image as ImageIcon,
    Download,
    Loader2,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    BarChart2,
    Activity,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function InwardPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Dropdown data
    const [parties, setParties] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [diameters, setDiameters] = useState<number[]>([]);
    const [activeColorDropdown, setActiveColorDropdown] = useState<string | null>(null);
    const [viewingInward, setViewingInward] = useState<any | null>(null);
    const [systemSettings, setSystemSettings] = useState<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [timePeriod, setTimePeriod] = useState('1M');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParty, setSelectedParty] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Dashboard Analytics Logic
    const dashboardStats = useMemo(() => {
        if (!inwards.length) return null;

        const sorted = [...inwards].sort((a, b) => new Date(b.inwardDate).getTime() - new Date(a.inwardDate).getTime());
        const latest = sorted[0];

        const now = new Date();

        // Chart Data based on timePeriod
        let daysToLookBack = 30;
        if (timePeriod === '7D') daysToLookBack = 7;
        else if (timePeriod === '3M') daysToLookBack = 90;
        else if (timePeriod === '6M') daysToLookBack = 180;
        else if (timePeriod === '1Y') daysToLookBack = 365;

        const startDate = new Date();
        startDate.setDate(now.getDate() - daysToLookBack);

        const filteredForChart = inwards.filter(i => new Date(i.inwardDate) >= startDate);

        const periodWeight = filteredForChart.reduce((acc, i) => acc + (Number(i.totalQuantity) || 0), 0);
        const periodCount = filteredForChart.length;

        // Calculate comparison weight (prior period of same length)
        const priorStartDate = new Date(startDate);
        priorStartDate.setDate(priorStartDate.getDate() - daysToLookBack);
        const priorPeriodInwards = inwards.filter(i => {
            const d = new Date(i.inwardDate);
            return d >= priorStartDate && d < startDate;
        });
        const priorWeight = priorPeriodInwards.reduce((acc, i) => acc + (Number(i.totalQuantity) || 0), 0);
        const weightTrend = priorWeight > 0 ? ((periodWeight - priorWeight) / priorWeight) * 100 : 0;

        // Group by Date for Area Chart
        const dailyMap = new Map();
        filteredForChart.forEach(i => {
            const dateKey = new Date(i.inwardDate).toISOString().split('T')[0];
            const weight = Number(i.totalQuantity) || 0;
            const pcs = i.items?.reduce((a: number, c: any) => a + (Number(c.pcs) || 0), 0) || 0;

            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, { date: dateKey, weight: 0, pcs: 0 });
            }
            const existing = dailyMap.get(dateKey);
            existing.weight += weight;
            existing.pcs += pcs;
        });

        const areaChartData = Array.from(dailyMap.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(d => ({
                ...d,
                displayDate: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            }));

        // Group by Party for Bar Chart (Top 5 Dyeing Houses)
        const partyMap = new Map();
        filteredForChart.forEach(i => {
            const name = i.partyId?.name || 'Unknown';
            partyMap.set(name, (partyMap.get(name) || 0) + (Number(i.totalQuantity) || 0));
        });

        const barChartData = Array.from(partyMap.entries())
            .map(([name, weight]) => ({ name, weight }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);

        return {
            latest,
            periodCount,
            periodWeight: periodWeight.toFixed(1),
            weightTrend: weightTrend.toFixed(1),
            areaChartData,
            barChartData
        };
    }, [inwards, timePeriod]);

    // Filtering and Pagination Logic
    const filteredInwards = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return inwards.filter(inw => {
            const matchesSearch = (
                inw.lotNo?.toLowerCase().includes(query) ||
                inw.challanNo?.toLowerCase().includes(query) ||
                inw.partyId?.name?.toLowerCase().includes(query) ||
                inw.billNo?.toLowerCase().includes(query) ||
                inw.items?.some((it: any) =>
                    it.color?.toLowerCase().includes(query) ||
                    it.materialId?.name?.toLowerCase().includes(query)
                )
            );
            const matchesParty = selectedParty === 'All' || inw.partyId?._id === selectedParty;
            return matchesSearch && matchesParty;
        }).sort((a, b) => new Date(b.inwardDate).getTime() - new Date(a.inwardDate).getTime());
    }, [inwards, searchTerm, selectedParty]);

    const paginatedInwards = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredInwards.slice(start, start + rowsPerPage);
    }, [filteredInwards, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredInwards.length / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    // Form State
    const [formData, setFormData] = useState({
        partyId: '',
        type: 'Fabric',
        inwardDate: new Date().toISOString().split('T')[0],
        challanNo: '',
        lotNo: '',
        billNo: '',
        colorGroups: [{
            color: '',
            materialId: '',
            isBatch: false,
            items: [{
                materialId: '',
                diameter: '',
                color: '',
                pcs: '' as any,
                quantity: '' as any,
                unit: 'KG',
                lotNo: '',
                status: 'Pending',
                rejectionCause: ''
            }]
        }],
        remarks: '',
        images: [] as string[],
        pendingImageFiles: [] as File[]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [inRes, pRes, mRes, cRes, dRes, sRes] = await Promise.all([
                fetch('/api/inward'),
                fetch('/api/masters/parties?type=DyeingHouse'),
                fetch('/api/masters/materials?category=Fabric'),
                fetch('/api/masters/colors'),
                fetch('/api/diameter-mapping'),
                fetch('/api/system/settings')
            ]);

            const [inData, pData, mData, cData, dData, sData] = await Promise.all([
                inRes.json(), pRes.json(), mRes.json(), cRes.json(), dRes.json(), sRes.json()
            ]);

            setInwards(Array.isArray(inData) ? inData : []);
            setParties(pData);
            setMaterials(mData);
            setColors(cData || []);
            setSystemSettings(sData);

            // Extract unique diameters from all mappings
            const allDias = new Set<number>();
            if (Array.isArray(dData)) {
                dData.forEach((product: any) => {
                    if (product.mappings) {
                        product.mappings.forEach((m: any) => allDias.add(m.diameter));
                    }
                });
            }
            setDiameters(Array.from(allDias).sort((a, b) => a - b));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!viewingInward) return;
        setIsDownloading(true);
        try {
            const element = document.getElementById('printable-report');
            if (!element) return;

            // Save original styles
            const originalStyle = element.getAttribute('style');

            // Temporary styles for high quality capture
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';
            element.style.width = '210mm'; // Fixed A4 width

            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // Pre-process the cloned document to remove ALL modern color functions
                    const allElements = clonedDoc.getElementsByTagName('*');
                    const modernColorRegex = /(oklch|oklab|lab|color-mix|light-dark|color\()/i;

                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);

                        // We check all potential color-carrying properties
                        const props = [
                            'color', 'backgroundColor', 'borderColor', 'outlineColor',
                            'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
                            'fill', 'stroke', 'boxShadow'
                        ];

                        props.forEach(prop => {
                            try {
                                const val = style.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
                                if (val && modernColorRegex.test(val)) {
                                    // Detect if it should be white or black based on the property or context
                                    // For a report, mostly we want black text/borders and white backgrounds
                                    let fallback = '#000000';
                                    if (prop === 'backgroundColor' || (prop === 'color' && el.tagName === 'BUTTON')) {
                                        // If background is using oklch, it's likely a light secondary color or white
                                        // In this specific report, we'll favor white for backgrounds and black for text
                                        if (prop === 'backgroundColor') fallback = '#ffffff';
                                    }
                                    el.style.setProperty(prop, fallback, 'important');
                                }
                            } catch (e) {
                                // Ignore properties that don't exist
                            }
                        });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // If content is longer than one page, we split it
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            const fileName = `Fabric_Inward_${viewingInward.challanNo || viewingInward.lotNo || 'Report'}.pdf`;
            pdf.save(fileName);

            // Restore original styles
            if (originalStyle) {
                element.setAttribute('style', originalStyle);
            } else {
                element.removeAttribute('style');
            }
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Failed to generate PDF. Please try the Print option instead.');
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddBatch = () => {
        setFormData({
            ...formData,
            colorGroups: [...formData.colorGroups, {
                color: '',
                materialId: '',
                isBatch: true,
                items: [{
                    materialId: '',
                    diameter: '',
                    color: '',
                    pcs: '' as any,
                    quantity: '' as any,
                    unit: 'KG',
                    lotNo: '',
                    status: 'Pending',
                    rejectionCause: ''
                }]
            }]
        });
    };

    const handleAddIndividual = () => {
        setFormData({
            ...formData,
            colorGroups: [...formData.colorGroups, {
                color: '',
                materialId: '',
                isBatch: false,
                items: [{
                    materialId: '',
                    diameter: '',
                    color: '',
                    pcs: '' as any,
                    quantity: '' as any,
                    unit: 'KG',
                    lotNo: '',
                    status: 'Pending',
                    rejectionCause: ''
                }]
            }]
        });
    };

    const handleRemoveGroup = (groupIndex: number) => {
        const newGroups = formData.colorGroups.filter((_, i) => i !== groupIndex);
        setFormData({ ...formData, colorGroups: newGroups });
    };

    const handleAddSubItem = (groupIndex: number) => {
        const newGroups = [...formData.colorGroups];
        newGroups[groupIndex].items.push({
            materialId: newGroups[groupIndex].isBatch ? newGroups[groupIndex].materialId : '',
            diameter: '',
            color: newGroups[groupIndex].isBatch ? newGroups[groupIndex].color : '',
            pcs: '' as any,
            quantity: '' as any,
            unit: 'KG',
            lotNo: '',
            status: 'Pending',
            rejectionCause: ''
        });
        setFormData({ ...formData, colorGroups: newGroups });
    };

    const handleRemoveSubItem = (groupIndex: number, itemIndex: number) => {
        const newGroups = [...formData.colorGroups];
        newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
        if (newGroups[groupIndex].items.length === 0) {
            // Remove group if no items left
            setFormData({ ...formData, colorGroups: newGroups.filter((_, i) => i !== groupIndex) });
        } else {
            setFormData({ ...formData, colorGroups: newGroups });
        }
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

            // Flatten color groups into flat items array for backend
            const flatItems = formData.colorGroups.flatMap(group =>
                group.items.map(item => ({
                    ...item,
                    // We use item-level color/materialId now as they can be overridden
                    color: item.color || group.color,
                    materialId: item.materialId || group.materialId
                }))
            );

            const payload = {
                ...formData,
                items: flatItems,
                images: finalImageUrls
            };
            delete (payload as any).pendingImageFiles;
            delete (payload as any).colorGroups;

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
        // Group items by color for local state
        const grouped = (item.items || []).reduce((acc: any[], curr: any) => {
            let group = acc.find(g => g.color === curr.color && (g.materialId === (curr.materialId?._id || curr.materialId) || !g.isBatch));
            if (!group) {
                group = {
                    color: curr.color,
                    materialId: curr.materialId?._id || curr.materialId || '',
                    isBatch: false,
                    items: []
                };
                acc.push(group);
            }
            group.items.push({
                materialId: curr.materialId?._id || curr.materialId || '',
                diameter: curr.diameter || '',
                pcs: curr.pcs ?? curr.pieces ?? curr.quantity_pcs ?? '',
                quantity: curr.quantity ?? '',
                unit: curr.unit || 'KG',
                lotNo: curr.lotNo || item.lotNo || '',
                status: curr.status || 'Pending',
                rejectionCause: curr.rejectionCause || ''
            });
            // If group has more than 1 item, it's definitely a batch
            if (group.items.length > 1) group.isBatch = true;
            return acc;
        }, []);

        setFormData({
            partyId: item.partyId?._id || item.partyId || '',
            type: item.type || 'Fabric',
            inwardDate: new Date(item.inwardDate).toISOString().split('T')[0],
            challanNo: item.challanNo || '',
            lotNo: item.lotNo || item.items?.[0]?.lotNo || '',
            billNo: item.billNo || '',
            colorGroups: grouped.length > 0 ? grouped : [{
                color: '',
                items: [{
                    materialId: '',
                    diameter: '',
                    pcs: 0,
                    quantity: 0,
                    unit: 'KG',
                    lotNo: '',
                    status: 'Pending',
                    rejectionCause: ''
                }]
            }],
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
            colorGroups: [{
                color: '',
                materialId: '',
                isBatch: false,
                items: [{
                    materialId: '',
                    diameter: '',
                    color: '',
                    pcs: '' as any,
                    quantity: '' as any,
                    unit: 'KG',
                    lotNo: '',
                    status: 'Pending',
                    rejectionCause: ''
                }]
            }],
            remarks: '',
            images: [],
            pendingImageFiles: []
        });
    };

    return (
        <div className="space-y-6">
            {/* Premium Analytics Dashboard */}
            {dashboardStats && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Lots entered */}
                        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-bold ${Number(dashboardStats.weightTrend) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {Number(dashboardStats.weightTrend) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(Number(dashboardStats.weightTrend))}%
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-foreground tracking-tight">{dashboardStats.periodCount}</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Lots Entered ({timePeriod})</p>
                        </div>

                        {/* Volume */}
                        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted/30" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground tracking-tight">{dashboardStats.periodWeight} <span className="text-xs font-bold text-muted">KG</span></h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Total Volume ({timePeriod})</p>
                        </div>

                        {/* Latest Record Info */}
                        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                            <div className="relative flex items-center justify-between h-full">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Latest Shipment Received</p>
                                        <h4 className="text-xl font-black text-white tracking-tighter">LOT #{dashboardStats.latest?.lotNo || 'N/A'}</h4>
                                    </div>
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-sm font-black text-white">{(dashboardStats.latest?.totalQuantity || dashboardStats.latest?.items?.reduce((a: any, c: any) => a + (Number(c.quantity) || 0), 0) || 0).toFixed(1)} KG</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Weight</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-800" />
                                        <div>
                                            <p className="text-sm font-black text-white">{dashboardStats.latest?.items?.reduce((a: any, c: any) => a + (Number(c.pcs) || 0), 0) || 0} PCS</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Pieces</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white italic text-[10px] font-medium max-w-[120px] text-right">
                                    From {dashboardStats.latest?.partyId?.name || 'New Processing'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Period Selector & Quick Actions - Moved after Metrics */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-y border-border/50">
                        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border/50 w-fit">
                            {['7D', '1M', '3M', '6M', '1Y'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setTimePeriod(p)}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${timePeriod === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:bg-secondary hover:text-foreground'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-tighter">
                            <Calendar className="w-3.5 h-3.5" />
                            Analytical Overview: {timePeriod === '1M' ? 'Last 30 Days' : timePeriod === '1W' ? 'Last 7 Days' : `Last ${timePeriod.replace('M', ' Months').replace('Y', ' Year')}`}
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Area Chart: Weight Trend */}
                        <div className="xl:col-span-2 bg-card rounded-3xl border border-border shadow-sm p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-widest">Weight Inward Trend</h3>
                                    <p className="text-[10px] text-muted font-bold mt-1">Daily accumulated fabric weight (KG)</p>
                                </div>
                                <div className="p-2 bg-secondary rounded-xl">
                                    <BarChart2 className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboardStats.areaChartData}>
                                        <defs>
                                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                                        />
                                        <ReTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="var(--primary)"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorWeight)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart: Dyeing House Breakdown */}
                        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 flex flex-col">
                            <h3 className="font-black text-sm uppercase tracking-widest mb-2">Top Sources</h3>
                            <p className="text-[10px] text-muted font-bold mb-8">Volume by Dyeing House (KG)</p>

                            <div className="flex-1 space-y-4">
                                {dashboardStats.barChartData.map((d, i) => {
                                    const maxWeight = Math.max(...dashboardStats.barChartData.map(x => x.weight));
                                    const percentage = (d.weight / maxWeight) * 100;
                                    return (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-black uppercase">
                                                <span className="truncate max-w-[150px]">{d.name}</span>
                                                <span className="text-primary">{d.weight.toFixed(0)} KG</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Fabric Inward & Sampling</h1>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Lot, Challan, Party, Color..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-72 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest bg-secondary/30 px-2 py-2 rounded-lg border border-border flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5" />
                            <select
                                value={selectedParty}
                                onChange={(e) => setSelectedParty(e.target.value)}
                                className="bg-transparent text-foreground focus:outline-none cursor-pointer pr-4"
                            >
                                <option value="All">All Dyeing Houses</option>
                                {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs font-bold text-muted uppercase">Rows:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-card border border-border rounded-lg text-xs font-bold p-1 focus:outline-none"
                        >
                            {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
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
            </div><div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden min-h-[400px]">
                {/* ... table ... */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-10 py-4">SL NO</th>
                                <th className="px-10 py-4">Lot</th>
                                <th className="px-10 py-4">Date</th>
                                <th className="px-10 py-4">Dyeing House</th>
                                <th className="px-10 py-4 text-center">PCS</th>
                                <th className="px-10 py-4">Total Qty (KG)</th>
                                <th className="px-10 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="p-10 text-center text-muted">Loading transactions...</td></tr>
                            ) : filteredInwards.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center">
                                    <Truck className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted font-bold uppercase text-xs tracking-widest">No matching records found</p>
                                </td></tr>
                            ) : (
                                paginatedInwards.map((inward, idx) => (
                                    <tr key={inward._id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-10 py-4 text-xs font-bold text-muted">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                        <td className="px-10 py-4">
                                            <div className="font-bold text-foreground">{inward.lotNo || '-'}</div>
                                        </td>
                                        <td className="px-10 py-4">
                                            <div className="text-[10px] text-muted font-black uppercase tracking-tight bg-secondary/50 px-1.5 py-0.5 rounded w-fit">
                                                {new Date(inward.inwardDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-10 py-4">
                                            <div className="text-sm font-semibold">{inward.partyId?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-muted">Challan: {inward.challanNo}</div>
                                        </td>
                                        <td className="px-10 py-4 text-center">
                                            <div className="text-sm font-bold text-muted">{inward.items.reduce((acc: number, cur: any) => acc + (cur.pcs || 0), 0)} PCS</div>
                                        </td>
                                        <td className="px-10 py-4">
                                            <div className="text-sm font-bold text-primary">{inward.totalQuantity || inward.items.reduce((acc: number, cur: any) => acc + cur.quantity, 0)} KG</div>
                                        </td>
                                        <td className="px-10 py-4 text-right">
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
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border bg-secondary/10 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
                            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredInwards.length)} of {filteredInwards.length} records
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1.5">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Only show first, last, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card border border-border text-muted hover:bg-secondary'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        pageNum === 2 ||
                                        pageNum === totalPages - 1
                                    ) {
                                        return <span key={pageNum} className="text-muted text-xs">...</span>;
                                    }
                                    return null;
                                }).filter(Boolean).reduce((acc: any[], curr: any, idx, arr) => {
                                    // Remove consecutive dots
                                    if (curr.type === 'span' && arr[idx - 1]?.type === 'span') return acc;
                                    return [...acc, curr];
                                }, [])}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
                        <div className="relative bg-card w-full max-w-4xl rounded-lg shadow-2xl border border-border overflow-hidden">
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
                                            className="w-full px-4 py-2 bg-background border border-border rounded-md outline-none"
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
                                            className="w-full px-4 py-2 bg-background border border-border rounded-md outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted">Challan No.</label>
                                        <input
                                            placeholder="e.g. DY-9922"
                                            value={formData.challanNo}
                                            onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-md outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted">Lot No.</label>
                                        <input
                                            placeholder="e.g. 12345"
                                            value={formData.lotNo}
                                            onChange={(e) => setFormData({ ...formData, lotNo: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-md outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-sm text-foreground">Items Received</h3>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleAddIndividual}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold transition-all border border-border"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Individual Item
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddBatch}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Color Batch
                                            </button>
                                        </div>
                                    </div>

                                    {formData.colorGroups.map((group, gIdx) => (
                                        <div key={gIdx} className={`rounded-lg border transition-all ${group.isBatch ? 'bg-secondary/5 border-border/50 shadow-sm' : 'bg-transparent border-transparent'}`}>
                                            {/* Header - Only show if it's a batch or has multiple items */}
                                            {(group.isBatch || group.items.length > 1) ? (
                                                <div className="p-3 bg-secondary/20 rounded-t-2xl border-b border-border/50 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-1 h-4 bg-primary rounded-full" />

                                                        {/* Color in Header */}
                                                        <div className="relative flex-1 max-w-[200px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveColorDropdown(activeColorDropdown === `batch-color-${gIdx}` ? null : `batch-color-${gIdx}`)}
                                                                className="w-full h-9 px-3 bg-background border border-border rounded-md outline-none text-xs flex items-center justify-between hover:border-primary/40 transition-all font-bold"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {group.color ? (
                                                                        <>
                                                                            <div
                                                                                className="w-3 h-3 rounded-full border border-black/10"
                                                                                style={{ backgroundColor: colors.find(c => c.name === group.color)?.hexCode || group.color }}
                                                                            />
                                                                            <span>{group.color}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-muted/50 italic">Batch Color</span>
                                                                    )}
                                                                </div>
                                                                <ChevronDown className={`w-3 h-3 text-muted transition-transform ${activeColorDropdown === `batch-color-${gIdx}` ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {activeColorDropdown === `batch-color-${gIdx}` && (
                                                                <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-2xl z-[100] max-h-56 overflow-hidden animate-in fade-in slide-in-from-top-1">
                                                                    <div className="p-1 overflow-y-auto max-h-56">
                                                                        {colors.map(c => (
                                                                            <button
                                                                                key={c._id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newGroups = [...formData.colorGroups];
                                                                                    newGroups[gIdx].color = c.name;
                                                                                    // Batch sync: update all items in this group
                                                                                    newGroups[gIdx].items = newGroups[gIdx].items.map(it => ({ ...it, color: c.name }));
                                                                                    setFormData({ ...formData, colorGroups: newGroups });
                                                                                    setActiveColorDropdown(null);
                                                                                }}
                                                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/5 rounded-lg transition-colors text-left"
                                                                            >
                                                                                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hexCode || c.name.toLowerCase() }} />
                                                                                <span className="text-xs font-semibold">{c.name}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Material in Header */}
                                                        <div className="flex-1 max-w-[200px]">
                                                            <select
                                                                value={group.materialId}
                                                                onChange={(e) => {
                                                                    const newGroups = [...formData.colorGroups];
                                                                    newGroups[gIdx].materialId = e.target.value;
                                                                    // Also update all items in this batch
                                                                    newGroups[gIdx].items = newGroups[gIdx].items.map(item => ({
                                                                        ...item,
                                                                        materialId: e.target.value
                                                                    }));
                                                                    setFormData({ ...formData, colorGroups: newGroups });
                                                                }}
                                                                className="w-full h-9 px-3 bg-background border border-border rounded-md outline-none text-xs font-bold appearance-none cursor-pointer"
                                                            >
                                                                <option value="">Batch Fabric Type</option>
                                                                {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddSubItem(gIdx)}
                                                            className="px-2.5 py-1 bg-background border border-border rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-secondary transition-colors"
                                                        >
                                                            + Add Variety
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveGroup(gIdx)}
                                                            className="p-1.5 text-muted hover:text-red-500 rounded-lg"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className={`p-1 space-y-2 ${group.isBatch ? 'mt-2 mb-2 p-3' : ''}`}>
                                                {group.items.map((item, iIdx) => (
                                                    <div key={iIdx} className={`grid grid-cols-1 md:grid-cols-[1fr_1fr_0.6fr_0.6fr_0.8fr_auto] gap-2.5 items-end p-2.5 rounded-md border border-border/20 bg-secondary/5 group/row`}>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-muted uppercase tracking-tighter ml-1">Fabric Type</label>
                                                            <select
                                                                value={item.materialId}
                                                                onChange={(e) => {
                                                                    const newGroups = [...formData.colorGroups];
                                                                    newGroups[gIdx].items[iIdx].materialId = e.target.value;
                                                                    setFormData({ ...formData, colorGroups: newGroups });
                                                                }}
                                                                className={`w-full h-8 px-2 bg-background border border-border rounded-lg outline-none text-xs appearance-none font-medium ${group.isBatch ? 'border-primary/20' : ''}`}
                                                            >
                                                                <option value="">Type</option>
                                                                {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1 relative">
                                                            <label className="text-[10px] font-bold text-muted uppercase tracking-tighter ml-1">Color</label>
                                                            <button
                                                                type="button"
                                                                disabled={group.isBatch}
                                                                onClick={() => setActiveColorDropdown(activeColorDropdown === `${gIdx}-${iIdx}` ? null : `${gIdx}-${iIdx}`)}
                                                                className={`w-full h-8 px-2 bg-background border border-border rounded-lg text-xs flex items-center justify-between ${group.isBatch ? 'opacity-70 cursor-not-allowed bg-secondary/30' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-1.5">
                                                                    {(item?.color || group?.color) ? (
                                                                        <div
                                                                            className="w-3 h-3 rounded-full border border-black/10"
                                                                            style={{
                                                                                backgroundColor: (colors as any[]).find((c: any) => c.name === (item.color || group.color))?.hexCode || (item.color || group.color)
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-3 h-3 rounded-full border border-dashed border-muted/50" />
                                                                    )}
                                                                    <span className={`truncate ${group.isBatch ? 'font-bold' : ''}`}>{item.color || group.color || 'Select'}</span>
                                                                </div>
                                                                {!group.isBatch && <ChevronDown className="w-3 h-3 text-muted" />}
                                                                {group.isBatch && <div className="w-3 h-3" />}
                                                            </button>
                                                            {!group.isBatch && activeColorDropdown === `${gIdx}-${iIdx}` && (
                                                                <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-2xl z-[100] max-h-56 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1">
                                                                    {colors.map(c => (
                                                                        <button
                                                                            key={c._id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newGroups = [...formData.colorGroups];
                                                                                newGroups[gIdx].items[iIdx].color = c.name;
                                                                                setFormData({ ...formData, colorGroups: newGroups });
                                                                                setActiveColorDropdown(null);
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-primary/5 rounded-lg text-xs text-left"
                                                                        >
                                                                            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hexCode || c.name.toLowerCase() }} />
                                                                            <span>{c.name}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-muted uppercase tracking-tighter ml-1">Dia</label>
                                                            <select
                                                                value={item.diameter}
                                                                onChange={(e) => {
                                                                    const newGroups = [...formData.colorGroups];
                                                                    newGroups[gIdx].items[iIdx].diameter = e.target.value;
                                                                    setFormData({ ...formData, colorGroups: newGroups });
                                                                }}
                                                                className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs appearance-none outline-none font-medium"
                                                            >
                                                                <option value="">Dia</option>
                                                                {diameters.map(dia => (
                                                                    <option key={dia} value={dia}>{dia}"</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-muted uppercase tracking-tighter ml-1">Pcs</label>
                                                            <input type="number" placeholder="0" value={item.pcs} onChange={(e) => { const newGroups = [...formData.colorGroups]; newGroups[gIdx].items[iIdx].pcs = e.target.value === '' ? '' : Number(e.target.value); setFormData({ ...formData, colorGroups: newGroups }); }} className="w-full h-8 px-2 text-center bg-background border border-border rounded-lg text-xs" />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-muted uppercase tracking-tighter ml-1">Weight</label>
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" placeholder="0" value={item.quantity} onChange={(e) => { const newGroups = [...formData.colorGroups]; newGroups[gIdx].items[iIdx].quantity = e.target.value === '' ? '' : Number(e.target.value); setFormData({ ...formData, colorGroups: newGroups }); }} className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs text-right font-bold text-primary" />
                                                                <span className="text-[10px] text-muted font-bold">KG</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex pb-1">
                                                            <button
                                                                type="button"
                                                                onClick={group.isBatch ? () => handleRemoveSubItem(gIdx, iIdx) : () => handleRemoveGroup(gIdx)}
                                                                className="p-1.5 text-muted/30 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Auto-Calculate Summary for this Color Batch */}
                                                {(group.isBatch || group.items.length > 1) && (
                                                    <div className="flex items-center justify-end gap-6 px-4 py-3 bg-secondary/10 rounded-xl mt-2 border border-border/10 shadow-inner">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Total Pcs:</span>
                                                            <span className="text-sm font-black text-slate-900">
                                                                {group.items.reduce((sum: number, it: any) => sum + (Number(it.pcs) || 0), 0)}
                                                            </span>
                                                        </div>
                                                        <div className="w-px h-6 bg-border/50" />
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Total Weight:</span>
                                                            <span className="text-sm font-black text-primary">
                                                                {group.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0).toFixed(2)} KG
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {group.isBatch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSubItem(gIdx)}
                                                        className="w-full py-2 border border-dashed border-border rounded-md text-[10px] font-bold uppercase tracking-wider text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 mt-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Another Variety to this Color
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Grand Total Summary Section */}
                                    {formData.colorGroups.some(g => g.items.some(it => it.pcs || it.quantity)) && (
                                        <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xl mt-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">
                                                    Σ
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shipment Grand Total</h4>
                                                    <p className="text-xs font-bold text-slate-500">Calculated across all color batches</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-12 px-4 text-right">
                                                <div>
                                                    <div className="text-3xl font-black tracking-tighter">
                                                        {formData.colorGroups.reduce((gSum, g) => gSum + g.items.reduce((iSum, it) => iSum + (Number(it.pcs) || 0), 0), 0)}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rolls</span>
                                                </div>
                                                <div className="border-l border-slate-800 pl-12">
                                                    <div className="text-3xl font-black tracking-tighter text-primary">
                                                        {formData.colorGroups.reduce((gSum, g) => gSum + g.items.reduce((iSum, it) => iSum + (Number(it.quantity) || 0), 0), 0).toFixed(2)}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total KG</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-2 pb-4">
                                        <button
                                            type="button"
                                            onClick={handleAddIndividual}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground hover:bg-secondary/80 rounded-md text-xs font-bold transition-all border border-border"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Individual Item
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddBatch}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-md text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Color Batch
                                        </button>
                                    </div>

                                    <div className="p-4 border-2 border-dashed border-border rounded-md space-y-3">
                                        <div className="flex items-center justify-between text-sm font-bold text-muted uppercase">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                Upload Challan / Fabric Photos (Required)
                                            </div>
                                            {uploadingImage && <span className="text-primary animate-pulse text-[10px]">Uploading...</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <label className={`w-24 h-24 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/30 transition-all text-muted ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                                <div key={`saved-${i}`} className="relative w-24 h-24 rounded-md overflow-hidden group border border-border">
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
                                                <div key={`pending-${i}`} className="relative w-24 h-24 rounded-md overflow-hidden group border border-border">
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
                                        className="flex-1 px-6 py-3 border border-border rounded-md font-bold text-muted hover:bg-secondary transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-6 py-3 bg-primary text-white rounded-md font-bold shadow-lg shadow-primary/20"
                                    >
                                        {editingItem ? 'Update Receipt' : 'Submit for Sampling'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* View Modal - Document Style */}
            {
                viewingInward && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setViewingInward(null)} />
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
                                .fixed.inset-0 {
                                    position: relative !important;
                                    display: block !important;
                                    z-index: auto !important;
                                }
                                .absolute.inset-0.bg-background\\/90 {
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
                                .overflow-y-auto {
                                    overflow: visible !important;
                                    height: auto !important;
                                }
                                #printable-report {
                                    width: 100% !important;
                                    padding: 15mm !important;
                                    margin: 0 !important;
                                    background: white !important;
                                    color: black !important;
                                    display: block !important;
                                    overflow: visible !important;
                                }
                                .no-print {
                                    display: none !important;
                                }
                                .page-break-inside-avoid {
                                    page-break-inside: avoid;
                                }
                                .page-break-before {
                                    page-break-before: always;
                                }
                            }
                        `}</style>

                            {/* Print Header Controls */}
                            <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between no-print">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isDownloading}
                                        className="px-4 py-2 bg-black text-white rounded-md text-xs font-bold shadow-lg shadow-black/20 flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all"
                                    >
                                        {isDownloading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        {isDownloading ? 'Downloading...' : 'Download PDF'}
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="px-4 py-2 bg-white text-black border border-black/10 rounded-md text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-all font-inter"
                                    >
                                        <FileImage className="w-4 h-4 text-primary" />
                                        Print A4
                                    </button>
                                </div>
                                <button onClick={() => setViewingInward(null)} className="p-2 hover:bg-card rounded-md border border-border">
                                    <X className="w-6 h-6 text-muted" />
                                </button>
                            </div>

                            <div id="printable-report" className="flex-1 overflow-y-auto p-12 space-y-12 bg-white text-black max-w-[210mm] mx-auto w-full">
                                {/* Company Header */}
                                <div className="flex justify-between items-start border-b-2 border-black pb-8">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black tracking-tighter text-black">{systemSettings?.companyName || 'SHYAMA INDUSTRIES'}</h1>
                                        <p className="text-sm font-bold text-gray-600 max-w-sm leading-relaxed">{systemSettings?.address || 'Fabric Manufacturers & Processing'}</p>
                                        <div className="flex gap-4 text-xs font-black uppercase tracking-widest text-gray-500">
                                            <span>GST: {systemSettings?.gstNumber || 'N/A'}</span>
                                            <span>PAN: {systemSettings?.panNumber || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-widest inline-block mb-3">Dyeing Inward Report</div>
                                        <p className="text-xs font-bold text-gray-500 italic">Report Generated: {new Date().toLocaleDateString()}</p>
                                        <p className="text-xs font-bold text-gray-500 italic">LOT NO: <span className="text-black font-black">{viewingInward.lotNo}</span></p>
                                    </div>
                                </div>

                                {/* Dyeing House & Challan Details */}
                                <div className="grid grid-cols-3 gap-12 py-8 bg-gray-50/50 rounded-xl px-8 border border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Dyeing House Details</p>
                                        <p className="text-xl font-black text-black">{viewingInward.partyId?.name || 'Unknown supplier'}</p>
                                        <p className="text-xs font-bold text-gray-500 mt-1">Ref: {viewingInward.partyId?.email || 'Registered Supplier'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Receipt Information</p>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold">Challan No: <span className="font-black">{viewingInward.challanNo}</span></p>
                                            <p className="text-sm font-bold">Inward Date: <span className="font-black">{new Date(viewingInward.inwardDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status Summary</p>
                                        <div className={`text-lg font-black uppercase ${viewingInward.status === 'Approved' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {viewingInward.status || 'Pending Review'}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400">Validated by QC Dept.</p>
                                    </div>
                                </div>

                                {/* Items Table - Grouped by Color */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fabric Breakdown (By Color)</p>
                                        <p className="text-xs font-bold text-gray-500">{viewingInward.items.length} Varieties Found</p>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-tighter border-b border-gray-200">
                                                    <th className="px-6 py-4">#</th>
                                                    <th className="px-6 py-4">Fabric Details</th>
                                                    <th className="px-6 py-4 text-center">Dia Size</th>
                                                    <th className="px-6 py-4 text-center">Rolls (Pcs)</th>
                                                    <th className="px-6 py-4 text-right">Net weight (KG)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {Object.entries(
                                                    viewingInward.items.reduce((acc: any, item: any) => {
                                                        const color = item.color || 'Unspecified';
                                                        if (!acc[color]) acc[color] = [];
                                                        acc[color].push(item);
                                                        return acc;
                                                    }, {})
                                                ).map(([color, colorItems]: [string, any], cIdx) => {
                                                    const subTotalPcs = colorItems.reduce((sum: number, it: any) => sum + (Number(it.pcs) || 0), 0);
                                                    const subTotalQty = colorItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);

                                                    return (
                                                        <React.Fragment key={color}>
                                                            <tr className="bg-gray-50/50">
                                                                <td colSpan={5} className="px-6 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: colors.find(c => c.name === color)?.hexCode || color }} />
                                                                        <span className="font-black text-xs uppercase tracking-tight">{color} Batch</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {colorItems.map((item: any, iIdx: number) => (
                                                                <tr key={`${cIdx}-${iIdx}`} className="text-sm group hover:bg-white transition-colors page-break-inside-avoid">
                                                                    <td className="px-6 py-4 text-gray-300 font-bold">{iIdx + 1}</td>
                                                                    <td className="px-6 py-4">
                                                                        <p className="font-black text-black">{item.materialId?.name || 'Fabric Variety'}</p>
                                                                        <p className="text-[10px] text-gray-400 uppercase font-black">{color}</p>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center font-black">{item.diameter}"</td>
                                                                    <td className="px-6 py-4 text-center font-bold text-gray-600">{item.pcs || 0}</td>
                                                                    <td className="px-6 py-4 text-right font-black text-black">{item.quantity} KG</td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-gray-50/30 border-b-2 border-gray-100">
                                                                <td colSpan={3} className="px-6 py-3 text-[10px] font-black text-gray-400 text-right uppercase">Subtotal {color}</td>
                                                                <td className="px-6 py-3 text-center font-black text-xs">{subTotalPcs} PCS</td>
                                                                <td className="px-6 py-3 text-right font-black text-xs text-primary">{subTotalQty.toFixed(2)} KG</td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-secondary/40 text-foreground font-black uppercase tracking-widest text-xs">
                                                    <td colSpan={3} className="px-6 py-5">GRAND TOTAL RECEIPT</td>
                                                    <td className="px-6 py-5 text-center">{viewingInward.items.reduce((acc: number, cur: any) => acc + (Number(cur.pcs) || 0), 0)} PCS</td>
                                                    <td className="px-6 py-5 text-right text-sm text-primary">{(viewingInward.totalQuantity || viewingInward.items.reduce((acc: number, cur: any) => acc + (Number(cur.quantity) || 0), 0)).toFixed(2)} KG</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Enhanced Fabric Summary Section */}
                                <div className="space-y-8 page-break-inside-avoid shadow-sm border border-gray-100 rounded-2xl p-8 bg-gray-50/10">
                                    <div className="border-b-2 border-primary/20 pb-2 mb-6">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Fabric Production Summary (DIA | PCS | KG)</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Categorized Summaries */}
                                        {['RIB', 'INTERLOCK'].map(category => {
                                            const searchTerms = category === 'RIB' ? ['RIB', 'RIP'] : [category];
                                            const filteredItems = viewingInward.items.filter((it: any) =>
                                                searchTerms.some(term => (it.materialId?.name || '').toUpperCase().includes(term))
                                            );
                                            if (filteredItems.length === 0) return null;

                                            const summary = filteredItems.reduce((acc: any, it: any) => {
                                                const dia = it.diameter || 'N/A';
                                                if (!acc[dia]) acc[dia] = { pcs: 0, qty: 0 };
                                                acc[dia].pcs += Number(it.pcs) || 0;
                                                acc[dia].qty += Number(it.quantity) || 0;
                                                return acc;
                                            }, {});

                                            return (
                                                <div key={category} className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                        <p className="text-xs font-black text-black uppercase tracking-tighter">{category} SUMMARY</p>
                                                    </div>
                                                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                                                        <table className="w-full text-left text-xs">
                                                            <thead>
                                                                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                                                                    <th className="px-4 py-2">DIA</th>
                                                                    <th className="px-4 py-2 text-center">PCS</th>
                                                                    <th className="px-4 py-2 text-right">KG</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {Object.entries(summary).sort().map(([dia, data]: [string, any]) => (
                                                                    <tr key={dia} className="font-bold">
                                                                        <td className="px-4 py-2 text-gray-500">{dia}"</td>
                                                                        <td className="px-4 py-2 text-center text-black">{data.pcs}</td>
                                                                        <td className="px-4 py-2 text-right text-primary">{data.qty.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="border-t-2 border-gray-100 bg-gray-50/50">
                                                                <tr className="font-black text-black">
                                                                    <td className="px-4 py-2 uppercase text-[9px]">TOTAL</td>
                                                                    <td className="px-4 py-2 text-center">{Object.values(summary).reduce((acc: number, curr: any) => acc + (Number(curr.pcs) || 0), 0)}</td>
                                                                    <td className="px-4 py-2 text-right text-primary">{Object.values(summary).reduce((acc: number, curr: any) => acc + (Number(curr.qty) || 0), 0).toFixed(2)}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* COMBINED GRAND SUMMARY */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-black" />
                                            <p className="text-xs font-black text-black uppercase tracking-tighter">COMBINED TOTAL SUMMARY (ALL VARIETIES)</p>
                                        </div>
                                        <div className="overflow-hidden rounded-xl border-2 border-black/5 bg-white shadow-sm">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-black text-[10px] font-black text-white uppercase tracking-widest">
                                                        <th className="px-6 py-3">DIAMETER SIZE</th>
                                                        <th className="px-6 py-3 text-center">TOTAL ROLLS (PCS)</th>
                                                        <th className="px-6 py-3 text-right">TOTAL NET WEIGHT (KG)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {Object.entries(
                                                        viewingInward.items.reduce((acc: any, item: any) => {
                                                            const dia = item.diameter || 'N/A';
                                                            if (!acc[dia]) acc[dia] = { qty: 0, pcs: 0 };
                                                            acc[dia].qty += Number(item.quantity) || 0;
                                                            acc[dia].pcs += Number(item.pcs) || 0;
                                                            return acc;
                                                        }, {})
                                                    ).sort().map(([dia, data]: [string, any]) => (
                                                        <tr key={dia} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-3 font-black text-gray-600">{dia}" DIA</td>
                                                            <td className="px-6 py-3 text-center font-bold">{data.pcs} PCS</td>
                                                            <td className="px-6 py-3 text-right font-black text-primary">{data.qty.toFixed(2)} KG</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-secondary/10 font-black text-black border-t-2 border-black/5">
                                                    <tr>
                                                        <td className="px-6 py-4">GRAND SUMMARY TOTAL</td>
                                                        <td className="px-6 py-4 text-center">{viewingInward.items.reduce((acc: number, cur: any) => acc + (Number(cur.pcs) || 0), 0)} PCS</td>
                                                        <td className="px-6 py-4 text-right text-primary">{(viewingInward.totalQuantity || viewingInward.items.reduce((acc: number, cur: any) => acc + (Number(cur.quantity) || 0), 0)).toFixed(2)} KG</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    {/* RIB & INTERLOCK COMBINED (Specific Request) */}
                                    {viewingInward.items.some((it: any) => {
                                        const name = (it.materialId?.name || '').toUpperCase();
                                        return name.includes('RIB') || name.includes('RIP') || name.includes('INTERLOCK');
                                    }) && (
                                            <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs font-black text-primary uppercase tracking-widest">RIB + INTERLOCK COMBINED SUB-TOTAL</p>
                                                    <div className="flex gap-8">
                                                        <div className="text-center">
                                                            <p className="text-xl font-black text-black">
                                                                {viewingInward.items
                                                                    .filter((it: any) => {
                                                                        const name = (it.materialId?.name || '').toUpperCase();
                                                                        return name.includes('RIB') || name.includes('RIP') || name.includes('INTERLOCK');
                                                                    })
                                                                    .reduce((sum: number, it: any) => sum + (Number(it.pcs) || 0), 0)}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Total Rolls</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-black text-primary">
                                                                {viewingInward.items
                                                                    .filter((it: any) => {
                                                                        const name = (it.materialId?.name || '').toUpperCase();
                                                                        return name.includes('RIB') || name.includes('RIP') || name.includes('INTERLOCK');
                                                                    })
                                                                    .reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0)
                                                                    .toFixed(2)} KG
                                                            </p>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Total Weight</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Challan Images */}
                                {viewingInward.images && viewingInward.images.length > 0 && (
                                    <div className="space-y-4 pt-12 page-break-before">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Supporting Documents / Dyeing Challan Photos</p>
                                        <div className="grid grid-cols-1 gap-8">
                                            {viewingInward.images.map((img: string, i: number) => (
                                                <div key={i} className="border-8 border-gray-50 rounded-xl overflow-hidden shadow-2xl bg-gray-50 page-break-inside-avoid max-h-[250mm] flex items-center justify-center">
                                                    <img src={img} alt={`Challan ${i}`} className="w-full h-auto object-contain max-h-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Signatures */}
                                <div className="pt-20 grid grid-cols-2 gap-24">
                                    <div className="border-t border-black pt-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-center">Received By (Signature)</p>
                                    </div>
                                    <div className="border-t border-black pt-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-center">Authorized Signatory</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Preview Modal (Lightbox) */}
            {
                previewImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setPreviewImage(null)} />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div className="relative max-w-4xl w-full max-h-[80vh] aspect-auto rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[105] animate-in zoom-in-95 duration-300 border border-white/10">
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
