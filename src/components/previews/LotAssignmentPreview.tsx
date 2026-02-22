'use client';

import React, { useState, useEffect } from 'react';
import {
    Printer, X, Scissors, Package, Layers,
    Calendar, Hash, Target, ClipboardCheck, Info
} from 'lucide-react';

interface LotAssignmentPreviewProps {
    lot: any;
    diameterMappings: any[];
    onClose: () => void;
}

export default function LotAssignmentPreview({ lot, diameterMappings, onClose }: LotAssignmentPreviewProps) {
    const handlePrint = () => {
        window.print();
    };

    const [settings, setSettings] = useState<any>(null);
    useEffect(() => {
        fetch('/api/system/settings')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setSettings(data); })
            .catch(() => { });
    }, []);

    const companyName = settings?.companyName || settings?.erpName || 'SHYAMA ERP';
    const companyAddress = settings?.address || '';
    const companyContact = settings?.contactNumber || '';
    const companyEmail = settings?.email || '';
    const companyGST = settings?.gstNumber || '';

    // Helper: resolve size from productSize field or fallback to diameter mapping
    const resolveSize = (asgn: any): string => {
        if (asgn.productSize && asgn.productSize.trim()) return asgn.productSize.trim();
        // Fallback: look up from diameter mapping using product name + fabric diameter
        if (diameterMappings?.length && asgn.productName && asgn.diameter) {
            const mapping = diameterMappings.find(
                m => m.productName?.trim().toLowerCase() === asgn.productName?.trim().toLowerCase()
            );
            const found = mapping?.mappings?.find(
                (sm: any) => Number(sm.diameter) === Number(asgn.diameter)
            );
            if (found?.size) return String(found.size).trim();
        }
        return '—';
    };

    // Interlock PCS per diameter+color (rib excluded — rib is NOT cut)
    const interlockPcsByDiaColor: Record<string, number> = (lot.items || []).reduce((acc: Record<string, number>, it: any) => {
        const isRib = it.materialId?.name?.toLowerCase()?.includes('rib') ||
            it.materialId?.subType?.toLowerCase()?.includes('rib');
        if (!isRib) {
            const key = `${it.diameter}_${(it.color || '').toLowerCase().trim()}`;
            acc[key] = (acc[key] || 0) + (Number(it.pcs) || 0);
        }
        return acc;
    }, {});

    // Only diameters that have interlock fabric received (rib diameters are excluded)
    const interlockDiameters = new Set(
        (lot.items || [])
            .filter((it: any) => {
                const isRib = it.materialId?.name?.toLowerCase()?.includes('rib') ||
                    it.materialId?.subType?.toLowerCase()?.includes('rib');
                return !isRib;
            })
            .map((it: any) => String(it.diameter))
    );

    // Sort assignments: diameter ascending, then color alphabetically
    // Filter out rib diameters — rib is NOT cut, only interlock is
    const sortedAssignments = [...(lot.assignments || [])]
        .filter((a: any) => interlockDiameters.size === 0 || interlockDiameters.has(String(a.diameter)))
        .sort((a: any, b: any) => {
            const diaDiff = Number(a.diameter) - Number(b.diameter);
            if (diaDiff !== 0) return diaDiff;
            return (a.color || '').toLowerCase().localeCompare((b.color || '').toLowerCase());
        });

    const totalDoz = sortedAssignments.reduce((sum: number, a: any) => sum + (Number(a.totalDozen) || 0), 0);
    const totalPcs = sortedAssignments.reduce((sum: number, a: any) => sum + (Number(a.totalPieces) || 0), 0);
    const totalUsedWeight = sortedAssignments.reduce((sum: number, a: any) => sum + (Number(a.usedWeight) || 0), 0);


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20">

                {/* Header Actions */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 no-print">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Scissors className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cutting Assignment Memo</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lot ID: {lot.lotNo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-12 bg-white print-area" id="printable-memo">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .print-area, .print-area * { visibility: visible; }
                            .print-area { 
                                position: absolute; 
                                left: 0; 
                                top: 0; 
                                width: 100%; 
                                padding: 20px !important;
                                background: white !important;
                            }
                            .no-print { display: none !important; }
                        }
                    `}</style>

                    {/* Branding / Letterhead */}
                    <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-slate-100">
                        <div>
                            <h1 className="text-3xl font-black text-indigo-600 tracking-tighter uppercase mb-1">{companyName}</h1>
                            {companyAddress && (
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 max-w-xs">{companyAddress}</p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                                {companyContact && <p className="text-[9px] font-bold text-slate-400">📞 {companyContact}</p>}
                                {companyEmail && <p className="text-[9px] font-bold text-slate-400">✉ {companyEmail}</p>}
                                {companyGST && <p className="text-[9px] font-bold text-slate-400">GST: {companyGST}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black text-slate-900 uppercase">Production Job Card</h2>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Lot Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Hash className="w-2.5 h-2.5 text-indigo-400" /> Lot Number
                            </span>
                            <div className="text-sm font-black text-slate-900">{lot.lotNo}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Layers className="w-2.5 h-2.5 text-indigo-400" /> Interlock
                            </span>
                            <div className="text-sm font-black text-slate-900 uppercase">{lot.materialName || '—'}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Target className="w-2.5 h-2.5 text-indigo-400" /> Supplier/Party
                            </span>
                            <div className="text-sm font-black text-slate-900 truncate uppercase">{lot.partyName || 'Internal'}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Package className="w-2.5 h-2.5 text-indigo-400" /> Colors
                            </span>
                            <div className="text-sm font-black text-slate-900">{lot.color || '—'}</div>
                        </div>
                        {/* Row 2 */}
                        <div className="space-y-1 pt-4 border-t border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <ClipboardCheck className="w-2.5 h-2.5 text-indigo-400" /> Total Fabric
                            </span>
                            <div className="text-sm font-black text-slate-900 flex items-baseline gap-2">
                                {(lot.interlockTotalPcs || 0) + (lot.ribTotalPcs || 0)}
                                <span className="text-[10px] font-bold text-slate-400">PCS</span>
                                <span className="text-slate-300 text-xs">·</span>
                                {lot.totalWeight.toFixed(2)}
                                <span className="text-[10px] font-bold text-slate-400">KG</span>
                            </div>
                        </div>
                        <div className="space-y-1 pt-4 border-t border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Layers className="w-2.5 h-2.5 text-indigo-400" /> Total Interlock
                            </span>
                            <div className="text-sm font-black text-slate-900 flex items-baseline gap-2">
                                {lot.interlockTotalPcs || 0}
                                <span className="text-[10px] font-bold text-slate-400">PCS</span>
                                <span className="text-slate-300 text-xs">·</span>
                                {(lot.interlockTotalKg || 0).toFixed(2)}
                                <span className="text-[10px] font-bold text-slate-400">KG</span>
                            </div>
                        </div>
                        <div className="space-y-1 pt-4 border-t border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Package className="w-2.5 h-2.5 text-indigo-400" /> Total Rib (Inward)
                            </span>
                            <div className="text-sm font-black text-slate-900 flex items-baseline gap-2">
                                {lot.ribTotalPcs || 0}
                                <span className="text-[10px] font-bold text-slate-400">PCS</span>
                                <span className="text-slate-300 text-xs">·</span>
                                {(lot.ribTotalKg || 0).toFixed(2)}
                                <span className="text-[10px] font-bold text-slate-400">KG</span>
                            </div>
                        </div>
                        <div className="space-y-1 pt-4 border-t border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Info className="w-2.5 h-2.5 text-indigo-400" /> Rib Required
                            </span>
                            <div className="text-sm font-black text-rose-600">
                                {Object.values(lot.ribStats || {}).reduce((sum: number, s: any) => sum + (s.required || 0), 0).toFixed(2)} <span className="text-[10px] font-bold text-rose-300">KG</span>
                            </div>
                        </div>
                        {(() => {
                            const totalExcess = Object.values(lot.ribStats || {}).reduce((sum: number, s: any) => {
                                const bal = (s.available || 0) - (s.required || 0);
                                return sum + bal;
                            }, 0);
                            const isExcess = totalExcess >= 0;
                            return (
                                <div className="space-y-1 pt-4 border-t border-slate-100">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Package className="w-2.5 h-2.5 text-indigo-400" /> Rib {isExcess ? 'Excess' : 'Shortage'}
                                    </span>
                                    <div className={`text-sm font-black flex items-baseline gap-1 ${isExcess ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isExcess ? '+' : ''}{totalExcess.toFixed(2)}
                                        <span className={`text-[10px] font-bold ${isExcess ? 'text-emerald-400' : 'text-rose-400'}`}>KG</span>
                                    </div>
                                </div>
                            );
                        })()}

                    </div>


                    {/* Assignment Table */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Scissors className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Detailed Cutting Assignments</h4>
                        </div>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                                    <th className="px-4 py-3 text-left rounded-l-lg border-r border-slate-800">Dia</th>
                                    <th className="px-4 py-3 text-left border-r border-slate-800">Color</th>
                                    <th className="px-4 py-3 text-left border-r border-slate-800">Assigned Product</th>
                                    <th className="px-4 py-3 text-center border-r border-slate-800">Size</th>
                                    <th className="px-4 py-3 text-center border-r border-slate-800">Interlock PCS</th>
                                    <th className="px-4 py-3 text-center border-r border-slate-800">Net Wt</th>
                                    <th className="px-4 py-3 text-center border-r border-slate-800">Dozens</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Pieces</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedAssignments.map((asgn: any, idx: number) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="text-xs font-black text-slate-900">{asgn.diameter} <span className="text-[8px] text-slate-400">CM</span></div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                                                    style={{ backgroundColor: asgn.color?.toLowerCase() }}
                                                />
                                                <span className="text-xs font-black text-slate-800 uppercase">{asgn.color || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-xs font-black text-indigo-600 uppercase italic tracking-tight">{asgn.productName}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-3 py-1 bg-slate-200 rounded-full text-[11px] font-black text-slate-900 border border-slate-300">
                                                {resolveSize(asgn)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs font-black text-indigo-700">
                                                {interlockPcsByDiaColor[`${asgn.diameter}_${(asgn.color || '').toLowerCase().trim()}`] || 0}
                                            </span>
                                            <span className="text-[8px] text-slate-400 ml-1 uppercase">PCS</span>
                                        </td>
                                        <td className="px-4 py-4 text-center font-bold text-slate-900 text-xs">
                                            {asgn.usedWeight.toFixed(2)} <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">KG</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs font-black text-emerald-600">{asgn.totalDozen}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-xs font-black text-slate-900">{asgn.totalPieces} <span className="text-[8px] text-slate-400 uppercase">PCS</span></span>
                                        </td>
                                    </tr>
                                ))}
                                {/* Totals Row */}
                                <tr className="border-t-2 border-slate-900 bg-slate-50">
                                    <td colSpan={5} className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Memo Grand Totals:</td>
                                    <td className="px-4 py-4 text-center text-xs font-black text-slate-900">{totalUsedWeight.toFixed(2)} KG</td>
                                    <td className="px-4 py-4 text-center text-xs font-black text-emerald-600">{totalDoz.toFixed(2)} DOZ</td>
                                    <td className="px-4 py-4 text-right text-xs font-black text-slate-900">{totalPcs} PCS</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Rib Requirement Analysis */}
                    {Object.keys(lot.ribStats || {}).length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Rib (Accessory) Reconciliation</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(lot.ribStats).map(([color, stats]: [string, any]) => {
                                    const balance = stats.available - stats.required;
                                    const isShort = balance < -0.01;
                                    return (
                                        <div key={color} className={`p-5 rounded-2xl border ${isShort ? 'bg-rose-50/50 border-rose-200' : 'bg-indigo-50/30 border-indigo-100'} group`}>
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/50">
                                                <div className="text-[10px] font-black uppercase text-slate-900">
                                                    {color === 'default' ? 'General' : color} Rib <span className="text-[8px] opacity-40 ml-1">Accessory</span>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isShort ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'}`}>
                                                    {isShort ? 'Shortage - Add Stock' : 'Excess Stock'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-2">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Required:</div>
                                                <div className="text-[10px] font-black text-slate-900 text-right">{stats.required.toFixed(3)} KG</div>

                                                <div className="text-[9px] font-bold text-slate-400 uppercase">In Stock:</div>
                                                <div className="text-[10px] font-black text-slate-900 text-right">{stats.available.toFixed(3)} KG</div>

                                                <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                                                <div className="text-[9px] font-bold text-slate-900 uppercase">{isShort ? 'Missing:' : 'Balance:'}</div>
                                                <div className={`text-xs font-black text-right ${isShort ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                    {isShort ? '-' : '+'}{Math.abs(balance).toFixed(3)} KG
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Rib Excess / Shortage Summary */}
                            {(() => {
                                const totalAvail = Object.values(lot.ribStats).reduce((s: number, st: any) => s + (st.available || 0), 0);
                                const totalReq = Object.values(lot.ribStats).reduce((s: number, st: any) => s + (st.required || 0), 0);
                                const totalBal = totalAvail - totalReq;
                                const isShort = totalBal < -0.01;
                                return (
                                    <div className={`mt-4 flex items-center justify-between px-6 py-4 rounded-2xl border-2 ${isShort ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isShort ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                                Total Rib {isShort ? 'Shortage' : 'Excess'} (All Colors Combined)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Total Available</div>
                                                <div className="text-xs font-black text-slate-900">{totalAvail.toFixed(3)} KG</div>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200" />
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Total Required</div>
                                                <div className="text-xs font-black text-slate-900">{totalReq.toFixed(3)} KG</div>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200" />
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">{isShort ? 'Shortage' : 'Excess'}</div>
                                                <div className={`text-sm font-black ${isShort ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {isShort ? '-' : '+'}{Math.abs(totalBal).toFixed(3)} KG
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Important Notes</h5>
                                    <p className="text-[9px] text-slate-400 leading-relaxed max-w-sm font-bold uppercase tracking-tight mt-1">
                                        This job card represents a snapshot of the technical assignment.
                                        Any changes to consumption coefficients after generate date will not be reflected here.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end justify-end">
                            <div className="w-48 border-b border-slate-900 mb-2 mt-10"></div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Signature</span>
                            <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Shyama ERP Verification Stamp</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

