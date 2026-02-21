'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    IndianRupee,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingDown,
    TrendingUp,
    FileText,
    User,
    X,
    CreditCard,
    History
} from 'lucide-react';

type Tab = 'Receivable' | 'Payable';

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState<Tab>('Receivable');
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dropdown Data
    const [parties, setParties] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        partyId: '',
        amount: 0,
        paidAmount: 0,
        referenceId: '',
        dueDate: '',
        type: 'Receivable' as Tab,
        description: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, partyRes] = await Promise.all([
                fetch(`/api/payments?type=${activeTab}`),
                fetch(`/api/masters/parties?type=${activeTab === 'Receivable' ? 'Client' : 'Stitcher'}`)
            ]);

            const [pData, pyData] = await Promise.all([
                payRes.json(), partyRes.json()
            ]);

            setPayments(Array.isArray(pData) ? pData : []);
            setParties(Array.isArray(pyData) ? pyData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setFormData(prev => ({ ...prev, type: activeTab }));
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted uppercase">Total Receivables</p>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mt-2 text-foreground">
                        ₹ {payments.reduce((acc, p) => acc + (p.type === 'Receivable' ? p.balanceAmount : 0), 0).toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted mt-1">Pending from clients </p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted uppercase">Total Payables</p>
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold mt-2 text-foreground">
                        ₹ {payments.reduce((acc, p) => acc + (p.type === 'Payable' ? p.balanceAmount : 0), 0).toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted mt-1">Pending payments to stitchers</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between bg-primary/5 border-primary/20">
                    <div>
                        <p className="text-sm font-medium text-primary uppercase">Net Balance</p>
                        <h3 className="text-2xl font-bold mt-2">
                            ₹ {(payments.reduce((acc, p) => acc + (p.type === 'Receivable' ? p.balanceAmount : 0), 0) - payments.reduce((acc, p) => acc + (p.type === 'Payable' ? p.balanceAmount : 0), 0)).toLocaleString()}
                        </h3>
                    </div>
                    <IndianRupee className="w-10 h-10 text-primary opacity-20" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setActiveTab('Receivable')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Receivable' ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-white/10'}`}
                >
                    Receivables
                </button>
                <button
                    onClick={() => setActiveTab('Payable')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Payable' ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-white/10'}`}
                >
                    Payables
                </button>
            </div>

            {/* List */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab.toLowerCase()} reports...`}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all scale-100 active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        New Bill / Invoice
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Reference / Bill</th>
                                <th className="px-6 py-4">Party</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-muted">Loading accounting data...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CreditCard className="w-8 h-8 text-muted" />
                                        </div>
                                        <h3 className="text-lg font-semibold">No {activeTab} Records</h3>
                                        <p className="text-muted mt-1">Record a new production bill or payment to get started.</p>
                                    </td>
                                </tr>
                            ) : payments.map((p) => (
                                <tr key={p._id} className="hover:bg-secondary/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{p.referenceId}</div>
                                        <div className="text-[10px] text-muted uppercase">{p.description || 'Production Bill'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{p.partyId?.name}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted">
                                            <Clock className="w-3 h-3" /> Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold">₹ {p.amount.toLocaleString()}</div>
                                        <div className={`text-[10px] font-bold ${p.balanceAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            Bal: ₹ {p.balanceAmount.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'Completed' ? 'bg-green-500/10 text-green-600' :
                                            p.status === 'Partial' ? 'bg-orange-500/10 text-orange-600' :
                                                'bg-red-500/10 text-red-600'
                                            }`}>
                                            {p.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-secondary rounded-lg">
                                            <History className="w-4 h-4 text-muted" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/40 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Record {activeTab}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-card rounded-md"><X className="w-6 h-6 text-muted" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted tracking-widest">Select {activeTab === 'Receivable' ? 'Client' : 'Stitcher'}</label>
                                <select
                                    required
                                    value={formData.partyId}
                                    onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium"
                                >
                                    <option value="">Choose Party</option>
                                    {parties.map(py => <option key={py._id} value={py._id}>{py.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted tracking-widest">Total Bill Amount</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl font-bold text-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted tracking-widest">Already Paid</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.paidAmount}
                                        onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl font-bold text-lg text-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted tracking-widest">Bill / Ref Number</label>
                                    <input
                                        required
                                        placeholder="e.g. INV-1001"
                                        value={formData.referenceId}
                                        onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted tracking-widest">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted tracking-widest">Description</label>
                                <input
                                    placeholder="Any notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-muted hover:bg-secondary rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all">Save Accounting Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { Trash2 } from 'lucide-react';
