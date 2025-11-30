import Tenant from "../models/Tenant.js";
import Stall from "../models/Stall.js";
import Waitlist from "../models/Waitlist.js";

const calculateGridPosition = (slotLabel) => {
    const numPart = parseInt(slotLabel.split('-')[1]);
    const index = numPart > 100 ? numPart - 101 : numPart - 1; 
    return { 
        row: Math.floor(index / 5) + 1, 
        col: (index % 5) + 1 
    };
};

export const getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find().sort({ createdAt: -1 });
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createTenant = async (req, res) => {
    try {
        const { slotNo, tenantType, transferWaitlistId, ...tenantData } = req.body;

        const newTenant = new Tenant({
            slotNo, 
            tenantType,
            ...tenantData
        });
        const savedTenant = await newTenant.save();

        const slots = slotNo.split(', '); 
        
        for (const slot of slots) {
            const { row, col } = calculateGridPosition(slot);
            const stallId = `${tenantType}-${row}-${col}`; 

            await Stall.findOneAndUpdate(
                { stallId: stallId },
                {
                    stallId,
                    slotNo: slot,
                    floor: tenantType,
                    row, 
                    col,
                    status: "Paid",
                    tenantId: savedTenant._id
                },
                { upsert: true, new: true }
            );
        }

        if (transferWaitlistId) {
            await Waitlist.findOneAndDelete({ 
                $or: [{ uid: transferWaitlistId }, { _id: transferWaitlistId }] 
            });
        }

        res.status(201).json(savedTenant);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tenant" });
    }
};

export const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingTenant = await Tenant.findById(id);
        if (!existingTenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const updatedTenant = await Tenant.findByIdAndUpdate(id, updateData, { new: true });

        if (updateData.slotNo && updateData.slotNo !== existingTenant.slotNo) {
            
            await Stall.updateMany(
                { tenantId: id }, 
                { $set: { status: "Available", tenantId: null } }
            );

            const newSlots = updateData.slotNo.split(', ');
            for (const slot of newSlots) {
                const { row, col } = calculateGridPosition(slot);
                const stallId = `${updatedTenant.tenantType}-${row}-${col}`; 
                
                await Stall.findOneAndUpdate(
                    { stallId: stallId },
                    {
                        stallId,
                        slotNo: slot,
                        floor: updatedTenant.tenantType,
                        row, 
                        col,
                        status: "Paid", 
                        tenantId: updatedTenant._id
                    },
                    { upsert: true }
                );
            }
        }

        res.json(updatedTenant);

    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Failed to update tenant" });
    }
};

export const deleteTenant = async (req, res) => {
    try {
        const tenantId = req.params.id;

        await Tenant.findByIdAndDelete(tenantId);
        await Stall.deleteMany({ tenantId: tenantId });

        res.json({ message: "Tenant deleted and stalls freed." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};