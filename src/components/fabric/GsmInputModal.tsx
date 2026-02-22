'use client';

import React, { useState } from 'react';
import { X, Activity, CheckCircle } from 'lucide-react';

interface GsmInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (gsm: number) => void;
    title?: string;
}

export function GsmInputModal({ isOpen, onClose, onConfirm, title = "Enter Fabric GSM" }: GsmInputModalProps) {
    const [gsm, setGsm] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const gsmNum = Number(gsm);
        if (gsmNum > 0) {
            onConfirm(gsmNum);
            setGsm('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Header */}
                <div className="p-6 bg-emerald-600 text-white flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black uppercase tracking-widest leading-none">{title}</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] mt-2 italic">Required for Quality Verification</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors relative z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Verified GSM (Grams per Square Meter)</label>
                        <div className="relative">
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                placeholder="e.g. 180.50"
                                value={gsm}
                                onChange={(e) => setGsm(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-6 py-4 text-xl font-black text-gray-900 transition-all outline-none"
                                required
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm uppercase">GSM</div>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                        <Activity className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-emerald-800 leading-relaxed uppercase tracking-tight">
                            The entered GSM will be recorded against all items in this approval batch for technical auditing.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] px-6 py-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 group active:scale-95"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Complete Approval
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
