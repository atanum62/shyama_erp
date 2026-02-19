'use client';

import React, { useState, useEffect } from 'react';
import { Save, Building2, Landmark, MapPin, FileText, Phone, Mail, BadgeCheck } from 'lucide-react';

export default function SystemSettingsPage() {
    const [settings, setSettings] = useState({
        companyName: '',
        erpName: '',
        address: '',
        contactNumber: '',
        email: '',
        gstNumber: '',
        panNumber: '',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            branchName: '',
        },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/system/settings');
            const data = await res.json();
            if (data && !data.error) {
                setSettings(data);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/system/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                // Automatically hide message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to update settings.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred while saving.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">System Configuration</h1>
                    <p className="text-muted text-sm">Manage company profile, tax identities, and banking information.</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
                    }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Profile */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-secondary/10 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h2 className="font-bold">Company Profile</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Registered Company Name</label>
                            <input
                                value={settings.companyName || ''}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                                placeholder="e.g. SHYAMA INDUSTRIES"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">ERP Display Name (Sidebar)</label>
                            <input
                                value={settings.erpName || ''}
                                onChange={(e) => setSettings({ ...settings, erpName: e.target.value })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-primary"
                                placeholder="e.g. SHYAMA ERP"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Contact Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    value={settings.contactNumber || ''}
                                    onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    type="email"
                                    value={settings.email || ''}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                    placeholder="contact@shyama.com"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Registered Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted" />
                                <textarea
                                    value={settings.address || ''}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                    placeholder="Enter full business address..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tax & Registration */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-secondary/10 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="font-bold">Tax & Registration</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">GSTIN Number</label>
                            <input
                                value={settings.gstNumber || ''}
                                onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                placeholder="19AAAAA0000A1Z5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">PAN Card Number</label>
                            <input
                                value={settings.panNumber || ''}
                                onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                placeholder="ABCDE1234F"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-secondary/10 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-primary" />
                        <h2 className="font-bold">Banking Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Bank Name</label>
                            <input
                                value={settings.bankDetails?.bankName || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    bankDetails: { ...settings.bankDetails, bankName: e.target.value }
                                })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                placeholder="e.g. HDFC Bank"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Account Number</label>
                            <input
                                value={settings.bankDetails?.accountNumber || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    bankDetails: { ...settings.bankDetails, accountNumber: e.target.value }
                                })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                placeholder="501XXXXXXXXXXXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">IFSC Code</label>
                            <input
                                value={settings.bankDetails?.ifscCode || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    bankDetails: { ...settings.bankDetails, ifscCode: e.target.value }
                                })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                placeholder="HDFC0001234"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-muted/60 tracking-wider">Branch Name</label>
                            <input
                                value={settings.bankDetails?.branchName || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    bankDetails: { ...settings.bankDetails, branchName: e.target.value }
                                })}
                                className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                placeholder="Central Branch, City"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}
