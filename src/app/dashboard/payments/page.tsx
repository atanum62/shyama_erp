'use client';

export default function PaymentsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Payment Tracking
            </h1>
            <p className="text-muted">Monitor receivables from clients and payables to job workers.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Receivables (from Clients)</h3>
                    <div className="text-3xl font-bold text-green-500">₹0.00</div>
                    <p className="text-sm text-muted mt-1">Pending payments from LUX/Rupa</p>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Payables (to Stitchers)</h3>
                    <div className="text-3xl font-bold text-red-500">₹0.00</div>
                    <p className="text-sm text-muted mt-1">Outstanding dues for job work</p>
                </div>
            </div>
        </div>
    );
}
