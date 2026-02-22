import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Inward from '@/backend/models/Inward';
import Party, { PartyType } from '@/backend/models/Party';
import Material, { MaterialCategory } from '@/backend/models/Material';

export async function GET() {
    try {
        await dbConnect();
        // Populate party and material details
        const inwards = await Inward.find()
            .populate('partyId', 'name')
            .populate('items.materialId', 'name subType')
            .sort({ createdAt: -1 });
        return NextResponse.json(inwards);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        console.log('Incoming Inward POST Body:', JSON.stringify(body, null, 2));

        // 1. Handle referenceNo (Required & Unique)
        if (!body.referenceNo) {
            body.referenceNo = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // 2. Handle clientId (Required)
        if (!body.clientId) {
            // Try to find the first client (LUX or Rupa)
            const client = await Party.findOne({ type: PartyType.CLIENT });
            if (client) {
                body.clientId = client._id;
            } else {
                // If no client exists, create a default one to satisfy schema
                const defaultClient = await Party.create({
                    name: 'Default Client',
                    code: 'DFTCLT',
                    type: PartyType.CLIENT,
                });
                body.clientId = defaultClient._id;
            }
        }

        // 3. Handle Items (mapping names like 'interlock' to IDs)
        if (body.items && body.items.length > 0) {
            for (let item of body.items) {
                // Propagate top-level lotNo to items if not already set
                if (!item.lotNo && body.lotNo) {
                    item.lotNo = body.lotNo;
                }

                // Initialize rejectionCause as empty string
                item.rejectionCause = '';
                item.status = 'Pending';

                // If materialId is a string but not a valid ObjectId (like "interlock")
                const isValidId = /^[0-9a-fA-F]{24}$/.test(item.materialId);

                if (!isValidId && typeof item.materialId === 'string' && item.materialId.length > 0) {
                    const materialName = item.materialId.charAt(0).toUpperCase() + item.materialId.slice(1);
                    let material = await Material.findOne({
                        $or: [
                            { name: materialName },
                            { subType: materialName }
                        ]
                    });

                    if (!material) {
                        // Create a default material if not found
                        material = await Material.create({
                            name: materialName,
                            code: materialName.toUpperCase().slice(0, 5) + Math.floor(Math.random() * 100),
                            category: MaterialCategory.FABRIC,
                            subType: materialName,
                            unit: item.unit || 'KG'
                        });
                    }
                    item.materialId = material._id;
                }
            }
        }

        // 3.1 Calculate totalQuantity and sanitize pcs
        if (body.items && body.items.length > 0) {
            body.totalQuantity = body.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
            body.items = body.items.map((item: any) => ({
                ...item,
                pcs: item.pcs !== undefined ? Number(item.pcs) : Number(item.pieces || 0)
            }));
            console.log('Processed POST items:', JSON.stringify(body.items, null, 2));
        }

        // 5. Ensure Images are clean strings
        if (body.images && Array.isArray(body.images)) {
            body.images = body.images.map((img: any) => typeof img === 'string' ? img : (img.secure_url || img.url)).filter(Boolean);
        }

        const inward = await Inward.create(body);
        const populatedInward = await Inward.findById(inward._id)
            .populate('partyId', 'name')
            .populate('items.materialId', 'name');

        console.log('Successfully Created Inward:', JSON.stringify(populatedInward, null, 2));
        return NextResponse.json(populatedInward, { status: 201 });
    } catch (error: any) {
        console.error('Inward POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
