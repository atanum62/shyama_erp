'use client';

export default function DispatchPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Dispatch (Delivery Challans)
            </h1>
            <p className="text-muted">Manage the final delivery of finished goods to clients .</p>

            <div className="p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-4">🚚</div>
                <h3 className="text-lg font-medium text-foreground">No Challans Generated</h3>
                <p className="text-muted max-w-xs mt-1">Ready to ship? Create a delivery challan for dispatched goods.</p>
                <button className="mt-6 px-4 py-2 bg-primary text-white rounded-lg font-medium">
                    + Generate Challan
                </button>
            </div>
        </div>
    );
}
