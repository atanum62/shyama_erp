import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Inward from '@/backend/models/Inward';
import ReturnHistory from '@/backend/models/ReturnHistory';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        let inward;
        if (body.itemId) {
            // Update specific item status
            const updateData: any = {};

            if (body.status) {
                updateData["items.$.status"] = body.status;

                // Only store cause if status is Rejected
                if (body.status === 'Rejected') {
                    updateData["items.$.rejectionCause"] = body.rejectionCause;
                    // Initialize returnStatus if rejected for color
                    if (body.rejectionCause === 'Color') {
                        updateData["items.$.returnStatus"] = 'Pending';
                    }
                } else {
                    updateData["items.$.rejectionCause"] = "";
                    updateData["items.$.returnStatus"] = ""; // Reset return status if not rejected
                }

                // Sync samplePassed with status
                updateData["items.$.samplePassed"] = body.status === 'Approved';
            }

            // Support direct returnStatus updates (from the Return section)
            if (body.returnStatus !== undefined) {
                updateData["items.$.returnStatus"] = body.returnStatus;
            }
            if (body.returnChallanNo !== undefined) {
                updateData["items.$.returnChallanNo"] = body.returnChallanNo;
            }
            if (body.returnDate !== undefined) {
                updateData["items.$.returnDate"] = body.returnDate;
            }
            if (body.returnImages !== undefined) {
                updateData["items.$.returnImages"] = body.returnImages;
            }

            // Support quantity update if provided
            if (body.quantity !== undefined) {
                updateData["items.$.quantity"] = Number(body.quantity);
            }

            // Support color update if provided (e.g. after redyeing)
            if (body.color !== undefined) {
                updateData["items.$.color"] = body.color;
            }

            // Handle Reweight History Tracking
            if (body.isReweightAction) {
                const currentInward = await Inward.findById(id);
                const currentItem = currentInward?.items.find((i: any) => i._id.toString() === body.itemId);
                if (currentItem) {
                    const reweightEvent = {
                        action: 'Reweighted',
                        timestamp: new Date(),
                        oldWeight: currentItem.quantity,
                        newWeight: Number(body.quantity),
                        color: currentItem.color,
                        remarks: body.remarks || 'Fabric Reweighted'
                    };
                    updateData["$push"] = { "items.$.history": reweightEvent };
                }
            }

            // Handle Rereceive Logic (History Tracking)
            if (body.rereceiveChallanNo !== undefined || body.rereceiveDate !== undefined) {
                const currentInward = await Inward.findById(id);
                const currentItem = currentInward.items.find((i: any) => i._id.toString() === body.itemId);

                if (currentItem) {
                    const historyEvents = [];

                    // 0. Include the original 'Rejected' event if we want a full timeline
                    // For now let's just trace from Return onwards as per current logic

                    // 1. Archive the 'Return' event if it exists
                    if (currentItem.returnStatus === 'Returned') {
                        historyEvents.push({
                            action: 'Returned',
                            timestamp: currentItem.returnDate || new Date(),
                            challanNo: currentItem.returnChallanNo,
                            images: currentItem.returnImages,
                            color: currentItem.color,
                            quantity: currentItem.quantity
                        });
                    }

                    // 2. Add the 'Rereceived' event
                    const rereceiveEvent = {
                        action: 'Rereceived',
                        timestamp: body.rereceiveDate || new Date(),
                        challanNo: body.rereceiveChallanNo,
                        images: body.rereceiveImages || [],
                        color: body.color || currentItem.color,
                        quantity: Number(body.quantity) || currentItem.quantity
                    };
                    historyEvents.push(rereceiveEvent);

                    updateData["$push"] = { "items.$.history": { $each: historyEvents } };

                    // Save to SEPARATE ReturnHistory collection - UPSERT logic
                    try {
                        const historyUpdate = {
                            $set: {
                                partyId: currentInward.partyId,
                                materialId: currentItem.materialId,
                                lotNo: currentItem.lotNo || currentInward.lotNo,
                                challanNo: currentInward.challanNo,
                                previousColor: currentItem.color,
                                newColor: body.color || currentItem.color,
                                receivedQuantity: Number(body.quantity) || currentItem.quantity,
                                returnDate: currentItem.returnDate,
                                returnChallanNo: currentItem.returnChallanNo,
                                returnImages: currentItem.returnImages || [],
                                rereceiveDate: body.rereceiveDate || new Date(),
                                rereceiveChallanNo: body.rereceiveChallanNo,
                                rereceiveImages: body.rereceiveImages || [],
                            },
                            $setOnInsert: {
                                inwardId: id,
                                itemId: body.itemId,
                                originalColor: currentItem.color,
                                originalQuantity: currentItem.quantity,
                            },
                        };

                        // We can't use $push and $set on the same field "history" in a simple way if we want to preserve old ones
                        // But here we are passing the full history from the currentItem which already has previous events
                        // PLUS the new events we just generated
                        const fullHistory = [
                            ...(currentItem.history || []),
                            ...historyEvents
                        ];
                        (historyUpdate.$set as any).history = fullHistory;

                        await ReturnHistory.findOneAndUpdate(
                            { inwardId: id, itemId: body.itemId },
                            historyUpdate,
                            { upsert: true, new: true }
                        );
                    } catch (historyErr) {
                        console.error('Failed to upsert ReturnHistory:', historyErr);
                    }

                    // Update last known challans
                    if (body.rereceiveChallanNo) {
                        updateData["items.$.rereceiveChallanNo"] = body.rereceiveChallanNo;
                    }
                    if (currentItem.returnChallanNo) {
                        updateData["items.$.returnChallanNo"] = currentItem.returnChallanNo;
                    }

                    // Clear operational status fields but KEEP the challan history
                    updateData["items.$.returnStatus"] = '';
                    updateData["items.$.returnDate"] = null;
                    updateData["items.$.returnImages"] = [];
                    updateData["items.$.rejectionCause"] = '';
                    updateData["items.$.status"] = 'Pending';
                }
            }

            // Support cuttingSize update if provided
            if (body.cuttingSize !== undefined) {
                updateData["items.$.cuttingSize"] = Number(body.cuttingSize);
            }

            // Support pcs update if provided
            if (body.pcs !== undefined) {
                updateData["items.$.pcs"] = Number(body.pcs);
            }

            // Support gsm update if provided
            if (body.gsm !== undefined) {
                updateData["items.$.gsm"] = Number(body.gsm);
            }

            let pushData: any = {};
            if (updateData["$push"]) {
                pushData = updateData["$push"];
                delete updateData["$push"];
            }

            const updateQuery: any = { $set: updateData };
            if (Object.keys(pushData).length > 0) {
                updateQuery.$push = pushData;
            }

            inward = await Inward.findOneAndUpdate(
                { _id: id, "items._id": body.itemId },
                updateQuery,
                { new: true }
            );

            // If cuttingSize, quantity, or color was updated, sync to CuttingSize collection if a record exists
            if (inward && (body.cuttingSize !== undefined || body.quantity !== undefined || body.color !== undefined)) {
                const item = inward.items.find((i: any) => i._id.toString() === body.itemId);
                if (item) {
                    const mongoose = (await import('mongoose')).default;
                    const CuttingSize = mongoose.models.CuttingSize || (await import('@/backend/models/CuttingSize')).default;

                    // Prepare sync data
                    const syncData: any = {
                        lotNo: item.lotNo || inward.lotNo,
                        color: item.color,
                        weight: item.quantity,
                        inwardId: id,
                        itemId: body.itemId,
                        materialId: item.materialId,
                        challanNo: inward.challanNo
                    };

                    // Only update size if provided, otherwise preserve existing or set default if creating
                    if (body.cuttingSize !== undefined) {
                        syncData.cuttingsize = Number(body.cuttingSize);

                        // If providing size, we always want to upsert
                        await CuttingSize.findOneAndUpdate(
                            { inwardId: id, itemId: body.itemId },
                            { $set: syncData },
                            { upsert: true, new: true }
                        );
                    } else {
                        // If updating other fields (like weight/color), only update IF the record already exists
                        await CuttingSize.findOneAndUpdate(
                            { inwardId: id, itemId: body.itemId },
                            { $set: syncData },
                            { new: false }
                        );
                    }
                }
            }

            // If quantity was updated, recalculate totalQuantity for the whole document
            if (inward && body.quantity !== undefined) {
                const totalQuantity = inward.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                inward = await Inward.findByIdAndUpdate(id, { totalQuantity }, { new: true });
            }
        } else {
            // Document level update (generic)
            inward = await Inward.findByIdAndUpdate(id, body, { new: true });
        }

        if (!inward) {
            return NextResponse.json({ error: 'Inward not found' }, { status: 404 });
        }

        return NextResponse.json(inward);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        console.log(`Incoming Inward PUT [${id}] Body:`, JSON.stringify(body, null, 2));

        // Remove _id from body to avoid MongoError: After applying the update, the (immutable) field '_id' was found to have been altered
        const { _id, ...updateData } = body;

        // Calculate totalQuantity and propagate lotNo
        if (updateData.items && Array.isArray(updateData.items)) {
            updateData.totalQuantity = updateData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
            updateData.items = updateData.items.map((item: any) => {
                const mappedItem = {
                    ...item,
                    pcs: item.pcs !== undefined ? Number(item.pcs) : Number(item.pieces || 0),
                    lotNo: item.lotNo || updateData.lotNo,
                    status: item.status || 'Pending',
                    rejectionCause: item.rejectionCause || ''
                };
                return mappedItem;
            });
            console.log('Processed updateData.items:', JSON.stringify(updateData.items, null, 2));
        }

        // Sanitize images to be clean strings
        if (updateData.images && Array.isArray(updateData.images)) {
            updateData.images = updateData.images.map((img: any) => typeof img === 'string' ? img : (img.secure_url || img.url)).filter(Boolean);
        }

        let inward = await Inward.findById(id);
        if (!inward) {
            return NextResponse.json({ error: 'Inward not found' }, { status: 404 });
        }

        // Apply updates
        Object.assign(inward, updateData);

        // Save to trigger hooks and schema validation
        await inward.save();

        // Re-populate for response
        inward = await Inward.findById(id)
            .populate('partyId', 'name')
            .populate('items.materialId', 'name');

        console.log('Successfully Saved Inward (via save()):', JSON.stringify(inward, null, 2));

        return NextResponse.json(inward);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');

        if (itemId) {
            // Delete specific item from inward
            const inward = await Inward.findById(id);
            if (!inward) {
                return NextResponse.json({ error: 'Inward not found' }, { status: 404 });
            }

            // Filter out the item
            inward.items = inward.items.filter((item: any) => item._id.toString() !== itemId);

            // Recalculate total quantity
            inward.totalQuantity = inward.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);

            // If no items left, delete the whole inward document?
            // The user said "just delete that specific item", but if it's the last one,
            // it's cleaner to keep the header or delete the doc.
            // Let's stick to deleting the item and let the user decide if they want the empty inward.
            await inward.save();

            // CASCADE DELETE: Remove from CuttingSize collection
            const mongoose = (await import('mongoose')).default;
            const CuttingSize = mongoose.models.CuttingSize || (await import('@/backend/models/CuttingSize')).default;
            await CuttingSize.deleteOne({ inwardId: id, itemId: itemId });

            return NextResponse.json({ message: 'Item deleted successfully', inward });
        } else {
            // Delete entire inward
            const inward = await Inward.findByIdAndDelete(id);

            if (!inward) {
                return NextResponse.json({ error: 'Inward not found' }, { status: 404 });
            }

            // CASCADE DELETE: Remove all items of this lot from CuttingSize collection
            const mongoose = (await import('mongoose')).default;
            const CuttingSize = mongoose.models.CuttingSize || (await import('@/backend/models/CuttingSize')).default;
            await CuttingSize.deleteMany({ inwardId: id });

            return NextResponse.json({ message: 'Inward deleted successfully' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
